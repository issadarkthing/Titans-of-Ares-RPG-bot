import { MessageEmbed } from "discord.js";
import { DateTime } from "luxon";
import { dbRun } from "../db/promiseWrapper";
import {
  createArena,
  getCandidates,
  getCurrentArena,
  setPhase,
  setTeam,
  TeamArena as TeamArenaDB,
  TeamArenaMember as TeamArenaMemberDB,
} from "../db/teamArena";
import { client } from "../main";
import { List } from "./List";
import { Player } from "./Player";
import { GOLD, random } from "./utils";

enum Days {
  MONDAY = 1,
  TUESDAY,
  WEDNESDAY,
  THURSDAY,
  FRIDAY,
  SATURDAY,
  SUNDAY,
}

export enum Phase {
  SIGNUP_1 = "signup_1",
  SIGNUP_2 = "signup_2",
  SIGNUP_3 = "signup_3",
  PREPARING = "preparing",
  BATTLE_1 = "battle_1",
  BATTLE_2 = "battle_2",
  BATTLE_3 = "battle_3",
  REWARD = "reward",
}

class TeamArenaMember {
  id: string;
  created: DateTime;
  teamArenaID: number;
  team: "RED" | "BLUE";
  player: Player;

  constructor(member: TeamArenaMemberDB, player: Player) {
    this.id = member.DiscordID;
    this.created = DateTime.fromISO(member.Created);
    this.teamArenaID = member.TeamArenaID;
    this.team = member.Team as TeamArenaMember["team"];
    this.player = player;
  }
}

export class TeamArena {
  id: number;
  created: DateTime;
  /** monday date of the week */
  monday: DateTime;
  phase: Phase;
  candidates: List<TeamArenaMember>;

  constructor(teamArena: TeamArenaDB, candidates: List<TeamArenaMember>) {
    this.id = teamArena.ID;
    this.created = DateTime.fromISO(teamArena.Created);
    this.phase = teamArena.Phase as Phase;
    this.monday = TeamArena.getMondayDate(this.created).set({
      hour: 7,
      minute: 0,
    });
    this.candidates = candidates;
  }

  static async getCurrentArena() {
    let arena = await getCurrentArena();
    if (!arena) {
      await createArena(TeamArena.getMondayDate(DateTime.now()).toISO());
      arena = await getCurrentArena();
    }

    await client.teamArenaChannel.guild.members.fetch();
    const members = await getCandidates(arena.ID);
    const candidates = members
      .map((member) => {
        const guildMember = client.teamArenaChannel.guild.members.cache.get(
          member.DiscordID
        );
        return guildMember;
      })
      .filter((member) => Boolean(member))
      .map((member) => Player.getPlayer(member!));

    const players = (await Promise.all(candidates)).map(
      (player) =>
        new TeamArenaMember(
          members.find((x) => x.DiscordID === player.id)!,
          player
        )
    );

    return new TeamArena(arena, List.from(players));
  }

  get timerUntilBattle() {
    const battleDate = this.monday.plus({ day: 3 });
    const timeLeft = battleDate.diffNow(["hour", "minute", "second"]);
    return timeLeft.toFormat("hh:mm:ss");
  }

  get timerUntilReward() {
    const battleDate = this.monday.plus({ day: 5 });
    const timeLeft = battleDate.diffNow(["hour", "minute", "second"]);
    return timeLeft.toFormat("hh:mm:ss");
  }

  private static isSignUpPhase1(time: DateTime) {
    return time.weekday >= Days.MONDAY && time.hour >= 7;
  }

  private static isSignUpPhase2(time: DateTime) {
    return time.weekday >= Days.TUESDAY && time.hour >= 7;
  }

  private static isSignUpPhase3(time: DateTime) {
    return time.weekday >= Days.TUESDAY && time.hour >= 19;
  }

  private static isPreparingPhase(time: DateTime) {
    return time.weekday >= Days.WEDNESDAY && time.hour >= 7;
  }

  private static isBattlePhase1(time: DateTime) {
    return time.weekday >= Days.THURSDAY && time.hour >= 7;
  }

  private static isBattlePhase2(time: DateTime) {
    return time.weekday >= Days.FRIDAY && time.hour >= 7;
  }

  private static isBattlePhase3(time: DateTime) {
    return time.weekday >= Days.FRIDAY && time.hour >= 19;
  }

  private static isRewardPhase(time: DateTime) {
    return time.weekday >= Days.SATURDAY && time.hour >= 7;
  }

  static getPhase(now: DateTime) {
    switch (true) {
      case TeamArena.isRewardPhase(now):
        return Phase.REWARD;
      case TeamArena.isBattlePhase3(now):
        return Phase.BATTLE_3;
      case TeamArena.isBattlePhase2(now):
        return Phase.BATTLE_2;
      case TeamArena.isBattlePhase1(now):
        return Phase.BATTLE_1;
      case TeamArena.isPreparingPhase(now):
        return Phase.PREPARING;
      case TeamArena.isSignUpPhase3(now):
        return Phase.SIGNUP_3;
      case TeamArena.isSignUpPhase2(now):
        return Phase.SIGNUP_2;
      case TeamArena.isSignUpPhase1(now):
        return Phase.SIGNUP_1;
    }
  }

  static sortMembers(candidates: TeamArenaMember[]): [TeamArenaMember[], TeamArenaMember[]] {
    candidates = random().shuffle(candidates);

    // uneven players
    if (candidates.length % 2 !== 0) {
      // determine strongest player
      const strongestPlayer = candidates.reduce((acc, candidate) => {
        if (candidate.player.level > acc.player.level) {
          return candidate;
        } else {
          return acc;
        }
      });

      candidates = candidates.filter((player) => strongestPlayer.id !== player.id);
      const half = Math.ceil(candidates.length / 2);
      // split into two teams
      const teamRed = candidates.slice(0, half);
      let teamBlue = candidates.slice(-half);

      // pick random blue member to be changed to red team
      const randomPlayer = random().pick(teamBlue);
      teamBlue = teamBlue.filter((player) => player.id !== randomPlayer.id);
      teamRed.push(randomPlayer);

      // add strongest player to team blue
      teamBlue.push(strongestPlayer);

      return random().shuffle([teamRed, teamBlue]) as [TeamArenaMember[], TeamArenaMember[]];
    }

    const half = Math.ceil(candidates.length / 2);
    // split into two teams
    const teamRed = candidates.slice(0, half);
    const teamBlue = candidates.slice(-half);
    return random().shuffle([teamRed, teamBlue]) as [TeamArenaMember[], TeamArenaMember[]];
  }

  static currentPhase() {
    return TeamArena.getPhase(DateTime.now());
  }

  /** returns the monday date of the week */
  static getMondayDate(now: DateTime) {
    let date = now;
    while (date.weekday !== Days.MONDAY) {
      date = date.minus({ day: 1 });
    }

    return date;
  }

  async onPrepare() {

    let teamRed: TeamArenaMember[] = [];
    let teamBlue: TeamArenaMember[] = [];
    try {
      [teamRed, teamBlue] = TeamArena.sortMembers(this.candidates.toArray());
    } catch {
      client.teamArenaChannel.send("Cannot start arena with only one candidate");
      return;
    }

    dbRun("BEGIN TRANSACTION");
    for (const candidate of teamRed) {
      await setTeam(this.id, candidate.id, "RED");
    }
    for (const candidate of teamBlue) {
      await setTeam(this.id, candidate.id, "BLUE");
    }
    dbRun("COMMIT");

    const teamRedList = teamRed
      .map((x, i) => `${i + 1}. ${x.player.name}`)
      .join("\n");

    const teamBlueList = teamBlue
      .map((x, i) => `${i + 1}. ${x.player.name}`)
      .join("\n");

    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle("Team Arena Scoreboard")
      .addField("Team Red", teamRedList)
      .addField("Team Blue", teamBlueList);

    client.teamArenaChannel.send(embed);
  }

  /** updates phase upon every second */
  static async mainLoop() {
    const arena = await TeamArena.getCurrentArena();
    const currentPhase = client.isDev && client.arenaPhase ? 
      client.arenaPhase : TeamArena.currentPhase();

    if (currentPhase && arena.phase !== currentPhase) {
      if (currentPhase === Phase.PREPARING) {
        arena.onPrepare();
      }

      setPhase(arena.id, currentPhase);
    }
  }
}
