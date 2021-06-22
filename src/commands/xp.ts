import { Message } from "discord.js";
import { getTotalXp } from "../db/getTotalPoints";

export async function xp(msg: Message, args: string[]) {

  const [userId] = args;
  const member = msg.guild?.members.cache.get(userId);

  if (!userId)
    return msg.channel.send("You need to give user id");
  else if (!member)
    return msg.channel.send("Member does not exists");

  const totalXp = await getTotalXp(userId);
  msg.channel.send(`${member.displayName} has \`${totalXp}xp\``);
}
