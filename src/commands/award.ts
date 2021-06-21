import { Message, TextChannel } from "discord.js";
import { award } from "../db/awardUser";
import { getAdminRoles } from "../db/isAdmin";
import { XP_LOG_CHANNEL } from "../index";


export default async function(msg: Message, args: string[]) {

  const userId = args[0];
  const amount = args[1];
  const reason = args.slice(2).join(" ");
  const authorId = msg.author.id;
  const member = msg.guild?.members.cache.get(userId);

  if (!userId)
    return msg.channel.send("You need to specify user id");
  else if (!amount)
    return msg.channel.send("You need to specify amount");
  else if (isNaN(parseInt(amount)))
    return msg.channel.send("Please give valid amount");
  else if (!reason)
    return msg.channel.send("You need to give a reason");
  else if (!member)
    return msg.channel.send("Member does not exist");

  const adminRoles = await getAdminRoles();
  const authorMember = msg.guild?.members.cache.get(authorId);
  const isAdmin = authorMember?.roles.cache
    .some(role => adminRoles.includes(role.id));
  
  if (!isAdmin)
    return msg.channel.send("Only admin can use this command");

  const logChannel = msg.guild?.channels.cache.get(XP_LOG_CHANNEL!) as TextChannel;
  if (!logChannel)
    throw new Error("XP log channel not found");

  try {

    const amountInt = parseInt(amount);
    const name = member.displayName;
    await award(userId, amountInt);
    const action = amountInt >= 0 ? "Added" : "Deducted";
    const prePosition = amountInt >= 0 ? "to" : "from";
    msg.channel.send("Executed successfully");
    logChannel.send(
      `${action} \`${amount} xp\` ${prePosition} ${name}! Reason: ${reason}`
    );

  } catch (e) {
    console.log(e);
    msg.channel.send("There was an error occured");
  }
}
