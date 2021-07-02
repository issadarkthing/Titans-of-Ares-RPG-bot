import { Message, TextChannel } from "discord.js";
import { xpLogTriggers, XP_LOG_CHANNEL } from "../index";
import { getConvertTable } from "../db/getConversions";
import { getChallengeId, getCurrentChallenge } from "../db/getChallengeId";
import { getLevel, getXp } from "../internals/utils";
import { Player } from "../internals/player";
import { Buff, BUFF_LIMIT, XP_THRESHOLD } from "../internals/buff";
import { getTimer, setTimer, TimerType } from "../db/timer";
import { DateTime } from "luxon";
import { addBuff } from "../db/getUsers";
import { oneLine } from "common-tags";

export async function xpLog(msg: Message, _: string[]) {

  const member = msg.guild?.members.cache.get(xpLogTriggers);
  if (!member) return;

  const lines = msg.content.split("\n");
  const rgx = /^Registered\sDay:\s(?<day>\d+)\s.*Progress:\s(?<value>\d+)\s(?<valueType>\w+)$/;

  for (const line of lines) {

    const matches = line.match(rgx);
    if (!matches || !matches.groups) return;

    const { day, value, valueType } = matches.groups;
    const challengeId = await getChallengeId(msg.channel.id);
    const tag = `${valueType}-${challengeId}`;
    const convertTable = await getConvertTable();
    const multiplier = convertTable.get(tag);

    if (!multiplier)
      return msg.channel.send("Invalid channel");

    const point = parseInt(value) * multiplier;
    const logChannel = msg.guild?.channels.cache.get(XP_LOG_CHANNEL!);
    const xp = Math.round(getXp(point));
    const player = await Player.getPlayer(member);
    const totalXp = player.xp;
    const currentLevel = player.level;
    const prevXp = totalXp - xp;
    const prevLevel = getLevel(prevXp);
    const name = player.name;

    if (!logChannel) 
      throw Error("No xp log channel specified");
    else if (!(logChannel instanceof TextChannel))
      throw Error("XP log channel is not TextChannel");

    logChannel.send(`${name} has earned \`${xp} xp\`!`)

    const timer = await getTimer(TimerType.Buff, member.id);

    const currentChallenge = await getCurrentChallenge();
    const d = new Date();
    if (
      xp >= XP_THRESHOLD && 
      !timer && 
      currentChallenge.ProofChannel === msg.channel.id &&
      parseInt(day) === d.getDate()
    ) {
      const buff = Buff.random();
      const expireDate = DateTime.now().plus(BUFF_LIMIT).toISO();
      setTimer(TimerType.Buff, player.userID, expireDate);
      addBuff(player.userID, buff.getID());
      logChannel.send(
        oneLine`Ares has granted ${member} a 2 hour ${buff.getName()} 
        for getting 10 points in the monthly challenge today!`
      );
    }

    if (currentLevel !== prevLevel) {
      logChannel.send(`${name} is now on **level ${currentLevel}**`);
    }
  }
}
