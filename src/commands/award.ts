import { Message } from "discord.js";
import isAdmin from "../db/isAdmin";


export default async function(msg: Message, args: string[]) {

  const userId = args[0];
  const amount = args[1];
  const authorId = msg.author.id;

  if (!userId)
    return msg.channel.send("You need to specify user id");
  else if (!amount)
    return msg.channel.send("You need to specify amount");
  else if (isNaN(parseInt(amount)))
    return msg.channel.send("Please give valid amount");

  const admin = await isAdmin(authorId);
  
  if (!admin)
    return msg.channel.send("Only admin can use this command");

  msg.channel.send("executed")
}
