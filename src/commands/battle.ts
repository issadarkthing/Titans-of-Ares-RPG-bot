import { Message } from "discord.js";
import hasUser from "../db/hasUser";
import { battle as battleSimulator } from "../internals/battle";
import { Player } from "../internals/player";
import { Challenger } from "../internals/challenger";


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
  const challenger = await Challenger.getChallenger(parseInt(level) || player.level);
  await battleSimulator(msg, player, challenger);
}
