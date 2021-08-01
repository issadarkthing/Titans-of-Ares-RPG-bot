import { Collection, Message, MessageReaction, User } from "discord.js";
import { Battle } from "../internals/Battle";
import { Player } from "../internals/Player";
import { Challenger } from "../internals/Challenger";
import { hasTimer, setEnergy, setTimer, TimerType } from "../db/timer";
import { DateTime } from "luxon";
import { ENERGY_TIMEOUT, showTimeLeft } from "../internals/energy";
import { oneLine } from "common-tags";

const emojis = ["◀️", "⏺️", "▶️"];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function battle(msg: Message, _args: string[]) {

  let question;

  try {
    const member = msg.guild?.members.cache.get(msg.author.id);

    if (!member)
      return msg.channel.send("Member does not exist");

    const player = await Player.getPlayer(member);

    if (player.energy <= 0) {

      const timeText = await showTimeLeft(TimerType.Energy, player.id);
      return msg.channel.send(`You have 0 energy left. Please wait for ${timeText}`);
    }

    const maxLevel = player.challengerMaxLevel;


    let validEmojis: string[] = [];

    if (player.challengerMaxLevel === 0) {
      validEmojis = [emojis[2]];
    } else if (player.challengerMaxLevel === 1) {
      validEmojis = [emojis[1], emojis[2]];
    } else if (player.challengerMaxLevel === 50) {
      validEmojis = [emojis[0], emojis[1]];
    } else {
      validEmojis = emojis;
    }

    const levelHint = validEmojis.map(emoji => {
      return emoji === emojis[0] ? emojis[0] + ` ${maxLevel - 1}`
           : emoji === emojis[1] ? emojis[1] + ` ${maxLevel}`
           : emojis[2] + ` ${maxLevel + 1}`
    }).join(" ");

    question = await msg.channel.send(
      oneLine`Which level you want to challenge? ${levelHint}`
    );

    for (const validEmoji of validEmojis) {
      await question.react(validEmoji);
    }

    const filter = (reaction: MessageReaction, user: User) => {
      return validEmojis.includes(reaction.emoji.name) && user.id === msg.author.id;
    }

    const colllected = await question.awaitReactions(filter, 
      { max: 1, time: 30 * 1000, errors: ["time"] });

    await question.delete();

    const reacted = colllected.first()!;
    const index = emojis.findIndex(e => e === reacted.emoji.name)! - 1;

    const expireDate = DateTime.now().plus(ENERGY_TIMEOUT).toISO();
    await setEnergy(player.id, -1);

    const prevEnergyTimer = await hasTimer(TimerType.Energy, player.id);
    if (!prevEnergyTimer)
      await setTimer(TimerType.Energy, player.id, expireDate);

    const selectedLevel = player.challengerMaxLevel + index;
    msg.channel.send(`Starting challenge level ${selectedLevel}`);
    const challenger = await Challenger.getChallenger(selectedLevel);
    const battle = new Battle(msg, player, challenger);
    await battle.run();

  } catch (e) {
    if (e instanceof Collection) {
      await question?.reactions.removeAll();
      await msg.channel.send("No level was chosen");
    } else {
      console.log(e)
    }
  }
}
