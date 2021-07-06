import { Message } from "discord.js";
import { Player } from "../internals/Player";

export async function profile(msg: Message, args: string[]) {

  const userId = args[0] || msg.author.id;
  const member = await msg.guild?.members.fetch(userId);
  const guild = msg.guild;

  if (!member)
    return msg.channel.send("Member does not exist");
  else if (!guild)
    return;

  msg.channel.startTyping();

  const player = await Player.getPlayer(member);
  const card = await player.getProfile();
  const stats = await player.getStats();

  msg.channel.stopTyping();

  await msg.channel.send(card);
  await msg.channel.send(stats);
}

