import { Message } from "discord.js";
import createProfile from "./createProfile";

export async function profile(msg: Message, args: string[]) {

  const userId = args[0] || msg.author.id;
  const member = msg.guild?.members.cache.get(userId);

  if (!member) {
    return msg.channel.send("User does not exist");
  } 

  const profile = await createProfile(member);
  msg.channel.send(profile);
}

