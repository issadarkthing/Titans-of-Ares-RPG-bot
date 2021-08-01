import { Message } from "discord.js";
import { addXP } from "../db/xp";
import { getTotalXp } from "../db/player";
import { getAdminRoles } from "../db/admin";
import rank from "./rank";
import { getLevel } from "../internals/utils";
import { Medal, MedalType } from "../internals/Medal";
import { Player } from "../internals/Player";
import { oneLine } from "common-tags";
import { logChannel } from "../main";
import { Pet } from "../internals/Pet";
import { addInventory, removeInventory } from "../db/inventory";
import { Fragment, FragmentID } from "../internals/Fragment";

// award <id> <xp|medal|fragment> <amount|medalType> <reason | revert>

export default async function(msg: Message, args: string[]) {

  const userId = args[0];
  if (!userId)
    return msg.channel.send("You need to specify user id");

  const awardType = args[1];
  if (!awardType)
    return msg.channel.send("You need to give award type");

  const amount = args[2];
  if (!amount)
    return msg.channel.send("You need to give valid amount or medal type");

  const reason = args.slice(3).join(" ");

  const member = msg.guild?.members.cache.get(userId);
  if (!member) {
    return msg.channel.send("member does not exist");
  }

  const adminRoles = await getAdminRoles();
  const authorMember = msg.member;
  const isAdmin = authorMember?.roles.cache
    .some(role => adminRoles.includes(role.id));
  
  if (!isAdmin)
    return msg.channel.send("Only admin can use this command");

  const player = await Player.getPlayer(member);

  if (awardType === "medal") {

    if (!Medal.isValidMedal(amount)) {
      return msg.channel.send("invalid medal type");
    }

    const medal = new Medal(amount as MedalType);
    const prevLevel = player.level;
    const isRevert = args[3]?.toLowerCase() === "revert";

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
    
    return;

  } else if (awardType === "xp") {
    if (!reason)
      return msg.channel.send("You need to give a reason");

    const amountInt = parseInt(amount);
    if (!amountInt)
      return msg.channel.send("Please give valid amount");

    const name = player.name;
    await addXP(userId, amountInt);
    const action = amountInt >= 0 ? "Added" : "Deducted";
    const prePosition = amountInt >= 0 ? "to" : "from";

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
    return;

  } else if (awardType === "fragment") {

    const amountInt = parseInt(amount);
    if (!amountInt)
      return msg.channel.send("Please give valid amount");

    const isRevert = args[4]?.toLowerCase() === "revert";

    if (isRevert) {
      const pet = args[3];
      const fragment = new Fragment(`fragment_pet_${pet}` as FragmentID);
      if (!fragment.pet) {
        return msg.channel.send("invalid pet name");
      }

      for (let i = 0; i < amountInt; i++) {
        removeInventory(player.id, fragment.id);
      }

      msg.channel.send("Executed successfully");
      return;
    }

    if (!reason)
      return msg.channel.send("You need to give a reason");

    for (let i = 0; i < amountInt; i++) {
      const fragment = Pet.random().fragment;
      addInventory(player.id, fragment.id);

      logChannel.send(
        `${player.member} has received **${fragment.name}**! Reason: ${reason}`
      );
    }

    return;
  }

  msg.channel.send("Executed successfully");
}
