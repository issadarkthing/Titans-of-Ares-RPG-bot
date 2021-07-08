import { Message } from "discord.js";
import { addXP } from "../db/xp";
import { getTotalXp } from "../db/player";
import { getAdminRoles } from "../db/admin";
import rank from "./rank";
import { getLevel } from "../internals/utils";
import { Medal, MedalType } from "../internals/Medal";
import { Player } from "../internals/Player";
import { oneLine } from "common-tags";
import { logChannel } from "../index";

export default async function(msg: Message, args: string[]) {

  const userId = args[0];
  const amount = args[1];
  const reason = args.slice(2).join(" ");
  const authorId = msg.author.id;
  const member = await msg.guild?.members.fetch(userId);

  if (!member) {
    return msg.channel.send("member does not exist");
  }

  const player = await Player.getPlayer(member);

  if (Medal.isValidMedal(args[1])) {

    const medal = new Medal(args[1] as MedalType);
    const prevLevel = player.level;
    const isRevert = args[2].toLowerCase() === "revert";

    if (isRevert) {
      await medal.revert(player);
      msg.channel.send("Executed successfully");
      return;
    }

    await medal.give(player);

    await player.sync();

    logChannel.send(oneLine`${member} has been awarded a **${medal.chest.name}** 
      and **${medal.xp} bonus xp** for getting a **${medal.name}**
      in the Monthly Challenge!`);

    if (player.level > prevLevel) {
      logChannel.send(`${player.name} is now on **level ${player.level}**`);
    }
    
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
    const name = player.name;
    await addXP(userId, amountInt);
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
      logChannel.send(`${name} is now on **level ${currentLevel}**`);
    }

    rank(msg, ["10"]);

  } catch (e) {
    console.log(e);
    msg.channel.send("There was an error occured");
  }
}
