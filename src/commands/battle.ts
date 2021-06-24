import { Message } from "discord.js";
import hasUser from "../db/hasUser";
import { battle as battleSimulator } from "../internals/battle";
import { Player } from "../internals/player";
import { Challenger } from "../internals/challenger";


export async function battle(msg: Message, args: string[]) {

  const member = msg.guild?.members.cache.get(msg.author.id);
  const isRegistered = await hasUser(msg.author.id);

  if (!member)
    return msg.channel.send("Member does not exist");
  else if (!isRegistered)
    return msg.channel.send("User has not registered to any challenge");

  const player = await Player.getPlayer(member);
  const challenger = await Challenger.getChallenger(player.level);
  await battleSimulator(msg, player, challenger);
}
