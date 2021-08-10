import { DateTime } from "luxon";
import { 
  TeamArena as TeamArenaDB, 
  TeamArenaMember as TeamArenaMemberDB,
  getCurrentArena,
  getCandidates,
  createArena,
} from "../db/teamArena";
import { List } from "./List";

enum Days {
  MONDAY = 1, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
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

  constructor(member: TeamArenaMemberDB) {
    this.id = member.DiscordID;
    this.created = DateTime.fromISO(member.Created);
    this.teamArenaID = member.TeamArenaID;
    this.team = member.Team as TeamArenaMember["team"];
  }
}

export class TeamArena {
  id: number;
  created: DateTime;
  /** monday date of the week */
  monday: DateTime;
  phase: Phase;
  candidates: List<TeamArenaMember>;

  constructor(teamArena: TeamArenaDB, members: TeamArenaMemberDB[]) {
    this.id = teamArena.ID;
    this.created = DateTime.fromISO(teamArena.Created);
    this.phase = teamArena.Phase as Phase;
    this.monday = TeamArena.getMondayDate(this.created).set({ hour: 7, minute: 0 });
    this.candidates = List.from(members.map(x => new TeamArenaMember(x)));
  }

  static async getCurrentArena() {
    let arena = await getCurrentArena();
    if (!arena) {
      await createArena(TeamArena.getMondayDate(DateTime.now()).toISO());
      arena = await getCurrentArena();
    }

    const members = await getCandidates(arena.ID);
    return new TeamArena(arena, members);
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

  private isSignUpPhase1(time: DateTime) {
    return time.weekday >= Days.MONDAY && time.hour >= 7;
  }

  private isSignUpPhase2(time: DateTime) {
    return time.weekday >= Days.TUESDAY && time.hour >= 7;
  }

  private isSignUpPhase3(time: DateTime) {
    return time.weekday >= Days.TUESDAY && time.hour >= 19;
  }

  private isPreparingPhase(time: DateTime) {
    return time.weekday >= Days.WEDNESDAY && time.hour >= 7;
  }

  private isBattlePhase1(time: DateTime) {
    return time.weekday >= Days.THURSDAY && time.hour >= 7;
  }

  private isBattlePhase2(time: DateTime) {
    return time.weekday >= Days.FRIDAY && time.hour >= 7;
  }

  private isBattlePhase3(time: DateTime) {
    return time.weekday >= Days.FRIDAY && time.hour >= 19;
  }

  private isRewardPhase(time: DateTime) {
    return time.weekday >= Days.SATURDAY && time.hour >= 7;
  }

  getPhase(now: DateTime) {
    switch (true) {
      case this.isRewardPhase(now): return Phase.REWARD;
      case this.isBattlePhase3(now): return Phase.BATTLE_3;
      case this.isBattlePhase2(now): return Phase.BATTLE_2;
      case this.isBattlePhase1(now): return Phase.BATTLE_1;
      case this.isPreparingPhase(now): return Phase.PREPARING;
      case this.isSignUpPhase3(now): return Phase.SIGNUP_3;
      case this.isSignUpPhase2(now): return Phase.SIGNUP_2;
      case this.isSignUpPhase1(now): return Phase.SIGNUP_1;
    }
  }

  currentPhase() {
    return this.getPhase(DateTime.now());
  }

  /** returns the monday date of the week */
  static getMondayDate(now: DateTime) {
    let date = now;
    while (date.weekday !== Days.MONDAY) {
      date = date.minus({ day: 1 });
    }

    return date;
  }
}
