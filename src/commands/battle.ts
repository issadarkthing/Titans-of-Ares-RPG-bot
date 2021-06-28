import { Collection, Message, MessageReaction, ReactionEmoji, User } from "discord.js";
import hasUser from "../db/hasUser";
import { battle as battleSimulator } from "../internals/battle";
import { Player } from "../internals/player";
import { Challenger } from "../internals/challenger";
import { setEnergy, setTimer, TimerType } from "../db/cooldowns";
import { DateTime } from "luxon";
import { ENERGY_TIMEOUT, showTimeLeft } from "../internals/timers";
import { oneLine } from "common-tags";

const emojis = ["◀️", "⏺️", "▶️"];

export async function battle(msg: Message, args: string[]) {

  try {
    const member = msg.guild?.members.cache.get(msg.author.id);
    const isRegistered = await hasUser(msg.author.id);

    if (!member)
      return msg.channel.send("Member does not exist");
    else if (!isRegistered)
      return msg.channel.send("User has not registered to any challenge");

    const player = await Player.getPlayer(member);

    if (player.energy <= 0) {

      const timeText = await showTimeLeft(player.userID);
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

    const question = await msg.channel.send(
      oneLine`Which level you want to challenge? ${levelHint}`
    );

    for (const validEmoji of validEmojis) {
      await question.react(validEmoji);
    }

    const filter = (reaction: MessageReaction, user: User) => {
      return validEmojis.includes(reaction.emoji.name) && user.id === msg.author.id;
    }

    const colllected = await question.awaitReactions(filter, 
      { max: 1, time: 6000, errors: ["time"] });

    await question.delete();

    const reacted = colllected.first()!;
    const index = emojis.findIndex(e => e === reacted.emoji.name)! - 1;

    const expireDate = DateTime.now().plus(ENERGY_TIMEOUT).toISO();
    await setEnergy(player.userID, -1);
    await setTimer(TimerType.Charge, player.userID, expireDate);

    const selectedLevel = player.challengerMaxLevel + index;
    msg.channel.send(`Starting challenge level ${selectedLevel}`);
    const challenger = await Challenger.getChallenger(selectedLevel);
    await battleSimulator(msg, player, challenger);

  } catch (e) {
    if (e instanceof Collection) {
      msg.channel.send("No level was chosen");
    } else {
      console.log(e)
    }
  }
}
