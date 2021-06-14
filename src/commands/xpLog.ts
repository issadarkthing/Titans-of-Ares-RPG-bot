import { Message, TextChannel } from "discord.js";
import { xpLogTriggers, XP_LOG_CHANNEL } from "../index";
import { getConvertTable } from "../db/getConversions";
import { getChallengeId } from "../db/getChallengeId";
import { getXp } from "./utils";

export async function xpLog(msg: Message, args: string[]) {

  const member = msg.guild?.members.cache.get(xpLogTriggers);
  if (!member) return;

  const fullText = msg.content;
  const rgx = /Progress:\s(?<value>\d+)\s(?<valueType>\w+)$/
  const matches = fullText.match(rgx);
  if (!matches || !matches.groups) return;

  const {value, valueType} = matches.groups;
  const challengeId = await getChallengeId("848830692237770761");
  const tag = `${valueType}-${challengeId}`;
  const convertTable = await getConvertTable();
  const multiplier = convertTable.get(tag);

  if (!multiplier) throw Error(`tag returns ${tag}`);

  const point = parseInt(value) * multiplier;
  const logChannel = msg.guild?.channels.cache.get(XP_LOG_CHANNEL!);
  const xp = Math.round(getXp(point));

  if (!logChannel) 
    throw Error("No xp log channel specified");
  else if (!(logChannel instanceof TextChannel))
    throw Error("XP log channel is not TextChannel");

  logChannel.send(
    `${member.nickname || member.user.username} has earned \`${xp} xp\`!`
  )
}
