import { Message, TextChannel } from "discord.js";
import { xpLogTriggers, XP_LOG_CHANNEL } from "../index";
import { getConvertTable } from "../db/getConversions";
import { getChallengeId } from "../db/getChallengeId";
import { getLevel, getXp } from "../internals/utils";
import { getTotalXp } from "../db/getTotalPoints";

export async function xpLog(msg: Message, args: string[]) {

  const member = msg.guild?.members.cache.get(xpLogTriggers);
  if (!member) return;

  const lines = msg.content.split("\n");
  const rgx = /Progress:\s(?<value>\d+)\s(?<valueType>\w+)$/

  for (const line of lines) {

    const matches = line.match(rgx);
    if (!matches || !matches.groups) return;

    const {value, valueType} = matches.groups;
    const challengeId = await getChallengeId(msg.channel.id);
    const tag = `${valueType}-${challengeId}`;
    const convertTable = await getConvertTable();
    const multiplier = convertTable.get(tag);

    if (!multiplier)
      return msg.channel.send("Invalid channel");

    const point = parseInt(value) * multiplier;
    const logChannel = msg.guild?.channels.cache.get(XP_LOG_CHANNEL!);
    const xp = Math.round(getXp(point));
    const totalXp = await getTotalXp(member.user.id);
    const currentLevel = getLevel(totalXp);
    const prevXp = totalXp - getXp(point);
    const prevLevel = getLevel(prevXp);
    const name = member.displayName;

    if (!logChannel) 
      throw Error("No xp log channel specified");
    else if (!(logChannel instanceof TextChannel))
      throw Error("XP log channel is not TextChannel");

    logChannel.send(
      `${name} has earned \`${xp} xp\`!`
    )

    // add logging for specific user
    if (member.user.id === "826313725501112342") {
      console.log("point", point);
      console.log("xp", xp);
      console.log("totalXp", totalXp);
      console.log("prevXp", prevXp);
      console.log("currentLevel", currentLevel);
      console.log("prevLevel", prevLevel);
      console.log("name", name);
    }

    if (currentLevel !== prevLevel) {
      logChannel.send(
        `${name} is now on **level ${currentLevel}**`
      );
    }
  }
}
