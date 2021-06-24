import { Message } from "discord.js";
import hasUser from "../db/hasUser";
import { battle as battleSimulator } from "../internals/battle";
import { Player, PlayerInit } from "../internals/player";


export async function battle(msg: Message, args: string[]) {

  const member = msg.guild?.members.cache.get(msg.author.id);
  const data: PlayerInit = {
    name: "Anon",
    level: 1,
    xp: 100,
    point: 100,
    hp: 50,
    strength: 2,
    speed: 4,
    armor: 0,
    criticalChance: 0.2,
    imageUrl: "https://cdn.discordapp.com/attachments/607917288527626250/857580537131958282/unknown.png",
  }
  
  const isRegistered = await hasUser(msg.author.id);

  if (!member)
    return msg.channel.send("Member does not exist");
  else if (!isRegistered)
    return msg.channel.send("User has not registered to any challenge");

  const player = await Player.getPlayer(member);
  const challenger = Player.getChallenger(data);
  await battleSimulator(msg, player, challenger);
}
