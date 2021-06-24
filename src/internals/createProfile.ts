import { GuildMember, MessageAttachment } from "discord.js";
import { getTotalXp } from "../db/getTotalPoints";
import { getLevelThreshold, getLevel } from "./utils";
//@ts-ignore
import { Rank } from "canvacord";

interface Options {
  rank?: number;
  image?: string;
}


export default async function(
  member: GuildMember, 
  options?: Options,
) {

  const user = member.user;
  const xp = await getTotalXp(user.id);
  const level = getLevel(xp);
  const levelThreshold = getLevelThreshold(level);
  const image = options?.image || "#111";

  let accPrevLevel = 0;
  let lvl = level;

  while (lvl > 1)
    accPrevLevel += getLevelThreshold(--lvl);

  const rankCard = await new Rank()
    .setAvatar(user.displayAvatarURL({ format: 'png', dynamic: true }))
    .setCurrentXP(Math.round(xp - accPrevLevel))
    .setRequiredXP(Math.round(levelThreshold))
    .setLevel(level)
    .setRank(options?.rank || 0, "", options?.rank || false)
    .setProgressBar("#ff0800", "COLOR", false)
    .setOverlay("#000000")
    .setUsername(member.nickname || user.username)
    .setDiscriminator(user.discriminator)
    .setBackground(options?.image ? "IMAGE" : "COLOR", image)
    .build();

  return new MessageAttachment(rankCard, "rank.png");
}
