import { Message, MessageAttachment } from "discord.js";
import { getTotalPoints } from "../db/getTotalPoints";
import { getXp, getLevelThreshold, getLevel } from "./utils";
//@ts-ignore
import { Rank } from "canvacord";

export async function profile(msg: Message, args: string[]) {

  const userId = args[0] || msg.author.id;

  const member = msg.guild?.members.cache.get(userId);

  if (!member) {
    return msg.channel.send("User does not exist");
  } 

  const totalPoints = await getTotalPoints(userId);
  const xp = getXp(totalPoints);
  const level = getLevel(xp);
  const levelThreshold = getLevelThreshold(level);

  const rankCard = await new Rank()
    .setAvatar(member.user.displayAvatarURL({ format: 'png', dynamic: true }))
    .setCurrentXP(xp)
    .setRequiredXP(levelThreshold)
    .setLevel(level)
    .setProgressBar("#ff0800", "COLOR", false)
    .setOverlay("#000000")
    .setUsername(member.user.username)
    .setDiscriminator(member.user.discriminator)
    .setBackground("IMAGE", 
      "https://cdn.discordapp.com/attachments/576986467084140557/852842157417168916/iu.png")
    .build();

  const attach = new MessageAttachment(rankCard, "rank.png");
  msg.channel.send(attach);
}

