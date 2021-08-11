import { oneLine } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { deduceCharge, getCandidates, joinArena, leaveArena, updatePoint } from "../db/teamArena";
import { TeamArena } from "../internals/TeamArena";
import { Battle } from "../internals/Battle";
import { ButtonHandler } from "../internals/ButtonHandler";
import Command from "../internals/Command";
import { Player } from "../internals/Player";
import { Phase } from "../internals/TeamArena";
import { BLUE_BUTTON, BROWN, random, RED_BUTTON, sleep } from "../internals/utils";
import { client } from "../main";

export default class extends Command {
  name = "teamarena";
  block = true;

  private async signUp(msg: Message, player: Player, arena: TeamArena) {

    const candidates = await getCandidates(arena.id);
    const candidate = candidates.find(x => x.DiscordID === player.id);

    if (!candidate) {
      const embed = new MessageEmbed()
        .setTitle("Team Arena")
        .setDescription(
            oneLine`You can currently sign up for the weekly Team Arena! Do you
            want to sign up now? `)

      const menu = new ButtonHandler(msg, embed, player.id);

      menu.addButton(BLUE_BUTTON, "yes", () => {
        joinArena(arena.id, player.id);
        msg.channel.send(
          oneLine`You have signed up for this weeks Team Arena and will be
          assigned to either Team Red or Team Blue when the sign up closes!`
        )
      })

      menu.addButton(RED_BUTTON, "no", () => {
        msg.channel.send("You did not sign up for the Team Arena this week!");
      })

      menu.addCloseButton();
      menu.run();

    } else {
      const embed = new MessageEmbed()
        .setTitle("Team Arena")
        .setDescription(
          oneLine`You already signed in for the Team Arena, it will start in
          \`(${arena.timerUntilBattle})\`. Do you want to keep being signed in?`
        )

      const menu = new ButtonHandler(msg, embed, player.id);
      menu.addButton(BLUE_BUTTON, "yes", () => {
        msg.channel.send(
          oneLine`You have signed up for this weeks Team Arena and will be
          assigned to either Team Red or Team Blue when the sign up closes!`
        )
      })

      menu.addButton(RED_BUTTON, "no", () => {
        leaveArena(arena.id, player.id);
        msg.channel.send("You did not sign up for the Team Arena this week!");
      })

      menu.addCloseButton();
      menu.run();
    }
  }

  private async battle(msg: Message, player: Player, arena: TeamArena) {

    const candidates = await getCandidates(arena.id);
    const candidate = candidates.find(x => x.DiscordID === player.id);

    if (!candidate) 
      return msg.channel.send("You are not registered for this week Team Arena");
    else if (candidate.Charge <= 0)
      return msg.channel.send(
        oneLine`You are out of arena tries, thanks for participating! The
        winning team will be announced in \`(${arena.timerUntilReward})\``);

    const embed = new MessageEmbed()
      .setTitle("Team Arena")
      .setColor(BROWN)
      .setDescription(
        oneLine`Welcome to the Team Arena! You have
        \`${candidate.Charge}/10\`. Do you want to battle now?`)

    const menu = new ButtonHandler(msg, embed, player.id);

    menu.addButton(BLUE_BUTTON, "fight", async () => {

      await msg.guild?.members.fetch();

      const opponentCandidate = random().pick(candidates);
      const opponentMember = msg.guild?.members
        .cache.get(opponentCandidate.DiscordID);

      if (!opponentMember)
        return msg.channel.send(`Cannot find user ${opponentCandidate.DiscordID}`);

      msg.channel.send(
        `You are battling ${opponentMember} of the opponents team!`
      )

      await sleep(5000);

      await deduceCharge(arena.id, player.id);
      const opponent = await Player.getPlayer(opponentMember);
      const battle = new Battle(msg, player, opponent);
      const isWon = await battle.run();

      if (isWon) {
        await updatePoint(arena.id, player.id, 1);
        await player.addArenaCoin(1);

        client.teamArenaChannel.send(
          `${player} has scored 1 point for Team ${candidate.Team} by defeating ${opponentMember}`
        )

        client.logChannel.send(
          `${player} has earned 1 Arena Coin by winning a battle in the Team Arena!`
        )

        // update score board
        client.teamArenaChannel.send(arena.scoreBoard());
      } else {
        client.teamArenaChannel.send(
          `${opponentMember} has succesfully defended against ${player} in the Team Arena!`
        )
      }
    })

    menu.addCloseButton();
    menu.run();
  }

  async exec(msg: Message, args: string[]) {

    const player = await Player.getPlayer(msg.member!);
    const arena = await TeamArena.getCurrentArena();
    const phase = arena.phase;

    if (client.isDev && args.length > 0) {
      const [phase] = args;
      if (Object.values(Phase).some(x => x === phase)) {
        client.arenaPhase = phase as Phase;
        msg.channel.send(`Successfully updated Team Arena Phase to \`${phase}\``);
      } else {
        msg.channel.send("invalid phase");
      }
      return;
    }

    switch (phase) {
      case Phase.SIGNUP_1:
      case Phase.SIGNUP_2:
      case Phase.SIGNUP_3:
        return this.signUp(msg, player, arena);
      case Phase.PREPARING:
        return msg.channel.send(
          "Registration for this week Team Arena has been closed"
        );
      case Phase.BATTLE_1:
      case Phase.BATTLE_2:
      case Phase.BATTLE_3:
        return this.battle(msg, player, arena);
      case Phase.REWARD:
        return msg.channel.send("This week Team Arena has ended");
    }
  }
}
