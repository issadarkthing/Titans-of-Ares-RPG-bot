import { oneLine } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { deduceCharge, getCandidates, joinArena, leaveArena, updatePoint } from "../db/teamArena";
import { Battle } from "../internals/Battle";
import { ButtonHandler } from "../internals/ButtonHandler";
import Command from "../internals/Command";
import { Player } from "../internals/Player";
import { Phase, TeamArena } from "../internals/TeamArena";
import { BLUE_BUTTON, BROWN, random, RED_BUTTON, sleep } from "../internals/utils";
import { client } from "../main";

export default class extends Command {
  name = "teamarena";
  aliases = ["ta"];
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
          assigned to either Team ${RED_BUTTON} or Team ${BLUE_BUTTON} when the
          sign up closes!`
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
          oneLine`You are still signed in for this weeks Team Arena!`
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

    const candidates = arena.candidates;
    const candidate = candidates.find(x => x.player.id === player.id);

    if (!candidate) 
      return msg.channel.send("You are not registered for this week Team Arena");
    else if (candidate.charge <= 0)
      return msg.channel.send(
        oneLine`You are out of arena tries, thanks for participating! The
        winning team will be announced in \`(${arena.timerUntilReward})\``);

    const embed = new MessageEmbed()
      .setTitle("Team Arena")
      .setColor(BROWN)
      .setDescription(
        oneLine`Welcome to the Team Arena! You have
        \`${candidate.charge}/10\`. Do you want to battle now?`)

    const menu = new ButtonHandler(msg, embed, player.id);

    menu.addButton(BLUE_BUTTON, "fight", async () => {

      const opponents = candidates.filter(x => x.team !== candidate.team);
      const opponent = random().pick(opponents);

      msg.channel.send(
        `You are battling ${opponent.player.name} of the opponents team!`
      )
      
      const profileImage = await opponent.player.getProfile();
      const opponentBanner = await msg.channel.send(profileImage);

      await sleep(5000);

      await opponentBanner.delete();

      await deduceCharge(arena.id, player.id);
      const battle = new Battle(msg, player, opponent.player);
      const isWon = await battle.run();

      if (isWon) {
        candidate.score++;
        await updatePoint(arena.id, player.id, 1);
        const team = candidate.team === "RED" ? RED_BUTTON : BLUE_BUTTON;

        client.logChannel.send(
          oneLine`${player.member} has scored 1 point for Team ${team} by
          defeating ${opponent.player.member}`
        )

        // update score board
        arena.updateScoreboard();
      } else {
        client.logChannel.send(
          oneLine`${opponent.player.member} has succesfully defended against
          ${player.member} in the Team Arena!`
        )
      }
    })

    menu.addCloseButton();
    await menu.run();
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
          oneLine`Registration for this week Team Arena has been closed and
          teams have been formed. The battles will start in
          \`${arena.timerUntilBattle}\``
        );
      case Phase.BATTLE_1:
      case Phase.BATTLE_2:
      case Phase.BATTLE_3:
        return await this.battle(msg, player, arena);
      case Phase.REWARD:
        return msg.channel.send("This week Team Arena has ended");
    }
  }
}
