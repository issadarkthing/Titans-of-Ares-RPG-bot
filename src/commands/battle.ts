import { Message } from "discord.js";
import hasUser from "../db/hasUser";
import { battle as battleSimulator } from "../internals/battle";
import { Player } from "../internals/player";
import { Challenger } from "../internals/challenger";
import { setEnergy, setTimer, TimerType } from "../db/cooldowns";
import { DateTime } from "luxon";
import { timerPeriod, showTimeLeft } from "../internals/timers";

export async function battle(msg: Message, args: string[]) {

  const member = msg.guild?.members.cache.get(msg.author.id);
  const isRegistered = await hasUser(msg.author.id);
  const level = args[0];

  if (!member)
    return msg.channel.send("Member does not exist");
  else if (!isRegistered)
    return msg.channel.send("User has not registered to any challenge");
  else if (level && !parseInt(level))
    return msg.channel.send("Invalid level");

  const player = await Player.getPlayer(member);

  if (player.energy <= 0) {

    const timeText = await showTimeLeft(player.userID);
    return msg.channel.send(`You have 0 energy left. Please wait for ${timeText}`);
  }

  const expireDate = DateTime.now().plus({ hours: timerPeriod }).toISO();
  await setEnergy(player.userID, -1);
  await setTimer(TimerType.Charge, player.userID, expireDate);

  const challenger = await Challenger.getChallenger(parseInt(level) || player.level);
  await battleSimulator(msg, player, challenger);
}
