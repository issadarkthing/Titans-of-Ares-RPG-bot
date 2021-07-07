import { Message, TextChannel } from "discord.js";
import { award } from "../db/awardUser";
import { getTotalXp } from "../db/getTotalPoints";
import { getAdminRoles } from "../db/isAdmin";
import { XP_LOG_CHANNEL } from "../index";
import rank from "./rank";
import { getLevel } from "../internals/utils";
import { addInventory } from "../db/inventory";
import { Chest } from "../internals/Chest";
import { Medal, MedalType } from "../internals/Medal";
import { Player } from "../internals/Player";

export default async function(msg: Message, args: string[]) {

  const userId = args[0];
  const amount = args[1];
  const reason = args.slice(2).join(" ");
  const authorId = msg.author.id;
  const member = msg.guild?.members.cache.get(userId) ||
    await msg.guild?.members.fetch(userId)

  const logChannel = msg.guild?.channels.cache.get(XP_LOG_CHANNEL!) as TextChannel;
  if (!logChannel)
    throw new Error("XP log channel not found");

  if (!member) {
    return msg.channel.send("member does not exist");
  }

  const player = await Player.getPlayer(member);

  if (Medal.isValidMedal(args[1])) {

    const medal = new Medal(args[1] as MedalType);
    const amount = parseInt(args[2]) || 1;
    if (!amount) {
      return msg.channel.send("Please provide valid number");
    }

    await medal.give(player, amount);

    logChannel.send(
      `${member} has been awarded **${medal.name}** and received **${medal.chest.name}**`
    )
    
    msg.channel.send("Executed successfully");
    return;
  }

  if (!userId)
    return msg.channel.send("You need to specify user id");
  else if (!amount)
    return msg.channel.send("You need to specify amount");
  else if (isNaN(parseInt(amount)))
    return msg.channel.send("Please give valid amount");
  else if (!reason)
    return msg.channel.send("You need to give a reason");

  const adminRoles = await getAdminRoles();
  const authorMember = msg.guild?.members.cache.get(authorId);
  const isAdmin = authorMember?.roles.cache
    .some(role => adminRoles.includes(role.id));
  
  if (!isAdmin)
    return msg.channel.send("Only admin can use this command");


  try {

    const amountInt = parseInt(amount);
    const name = member.displayName;
    await award(userId, amountInt);
    const action = amountInt >= 0 ? "Added" : "Deducted";
    const prePosition = amountInt >= 0 ? "to" : "from";
    msg.channel.send("Executed successfully");

    const totalXp = await getTotalXp(userId);
    const prevXp = totalXp - amountInt;
    const prevLevel = getLevel(prevXp);
    const currentLevel = getLevel(totalXp);

    logChannel.send(
      `${action} \`${amount} xp\` ${prePosition} ${name}! Reason: ${reason}`
    );


    if (currentLevel > prevLevel) {
      logChannel.send(
        `${name} is now on **level ${currentLevel}**`
      );
    }

    rank(msg, ["10"]);

  } catch (e) {
    console.log(e);
    msg.channel.send("There was an error occured");
  }
}
