import { Message } from "discord.js";
import hasUser from "../db/hasUser";
import { Player } from "../internals/player";

export async function profile(msg: Message, args: string[]) {

  const userId = args[0] || msg.author.id;
  const member = msg.guild?.members.cache.get(userId);
  const guild = msg.guild;

  if (!member)
    return msg.channel.send("Member does not exist");
  else if (!guild)
    return;

  const user = await hasUser(member.user.id);

  if (!user)
    return msg.channel.send("User has not registered to any challenge");

  const player = await Player.getPlayer(member);
  const card = await player.getProfile();
  const stats = await player.getStats();

  await msg.channel.send(card);
  await msg.channel.send(stats);
}

