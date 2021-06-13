import { Message } from "discord.js";
import createProfile from "./createProfile";
import hasUser from "../db/hasUser";

export async function profile(msg: Message, args: string[]) {

  const userId = args[0] || msg.author.id;
  const member = msg.guild?.members.cache.get(userId);

  if (!member)
    return msg.channel.send("Member does not exist");

  const user = await hasUser(member.user.id);

  if (!user)
    return msg.channel.send("User has not registered to any challenge");

  const card = await createProfile(member);
  msg.channel.send(card);
}

