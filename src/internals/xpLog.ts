import { Message, TextChannel } from "discord.js";
import { xpLogTriggers, XP_LOG_CHANNEL } from "../index";
import { getChallengeId, getConvertTable } from "../db/monthlyChallenge";
import { getLevel, getXp } from "../internals/utils";
import { Player } from "../internals/Player";
import { Buff, BUFF_LIMIT, XP_THRESHOLD } from "../internals/Buff";
import { getTimer, setTimer, TimerType } from "../db/timer";
import { DateTime } from "luxon";
import { addBuff } from "../db/player";
import { oneLine } from "common-tags";
import { createEntry, getXPEntry, resetXPEntry, setXPEntry } from "../db/xpEntry";
import assert from "assert";

const rgx = /^Registered\sDay:\s(?<day>\d+)\s.*Progress:\s(?<value>\d+[,|\.]?\d*)\s(?<valueType>\w+).*$/;

const tests = `
Registered Day: 7 Progress: 6641 steps
Registered Day: 8 Progress: 1 yoga
Registered Day: 8 Progress: 1 strength
Registered Day: 8 Added Progress: 10,7 cyclingkm New Progress: 10,7 cyclingkm
Registered Day: 7 Added Progress: 14,81 cyclingkm New Progress: 17,810001 cyclingkm
Registered Day: 7 Added Progress: 14.81 cyclingkm New Progress: 17.810001 cyclingkm
Registered Day: 7 Added Progress: 14.81 cyclingkm New Progress: 7.8 cyclingkm
Registered Day: 7 Added Progress: 14.81 cyclingkm New Progress: 0.5 cyclingkm
`;

const result = [
  {value: "6641", valueType: "steps"},
  {value: "1", valueType: "yoga"},
  {value: "1", valueType: "strength"},
  {value: "10,7", valueType: "cyclingkm"},
  {value: "17,810001", valueType: "cyclingkm"},
  {value: "17.810001", valueType: "cyclingkm"},
  {value: "7.8", valueType: "cyclingkm"},
  {value: "0.5", valueType: "cyclingkm"},
]

const lines = tests.split("\n").filter(x => !!x);

for (let i = 0; i < lines.length; i++) {
  const matches = lines[i].match(rgx)!;
  const { value, valueType } = matches.groups!;
  assert.strictEqual(value, result[i].value);
  assert.strictEqual(valueType, result[i].valueType);
}


export async function xpLog(msg: Message) {

  const member = msg.guild?.members.cache.get(xpLogTriggers);
  if (!member) return;

  const lines = msg.content.split("\n");

  for (const line of lines) {

    const matches = line.match(rgx);
    if (!matches || !matches.groups) return;

    const { value, valueType } = matches.groups;
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

    logChannel.send(`${name} has earned \`${xp} xp\`!`);

    const timer = await getTimer(TimerType.Buff, member.id);
    const day = parseInt(matches.groups.day);
    let xpEntry = await getXPEntry(challengeId, day, member.id);

    if (xpEntry) {
      !timer && await setXPEntry(xpEntry.ID, xp);
    } else {
      await createEntry(challengeId, day, member.id, xp);
    }

    xpEntry = await getXPEntry(challengeId, day, member.id);

    if (xpEntry.XP >= XP_THRESHOLD && !timer) {
      await resetXPEntry(challengeId, day, member.id);

      const buff = Buff.random();
      const expireDate = DateTime.now().plus(BUFF_LIMIT).toISO();
      setTimer(TimerType.Buff, player.id, expireDate);
      addBuff(player.id, buff.id);

      logChannel.send(
        oneLine`Ares has granted ${member} a 2 hour ${buff.name}
        for getting 10 points in the monthly challenge today!`
      );
    }

    if (currentLevel !== prevLevel) {
      logChannel.send(`${name} is now on **level ${currentLevel}**`);
    }
  }
}
