import { TextChannel, Message } from "discord.js";
import { getActivities } from "../db/getActivity";
import { getConvertTable } from "../db/getConversions";
import createProfile from "./createProfile";

const backgrounds = [
  "https://cdn.discordapp.com/attachments/576986467084140557/852842157417168916/iu.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/853178145422442506/unknown.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/852846797041696798/iu.png",
];

async function nukeChannel(channel: TextChannel) {
    let deleted = 0;
    do {
      const messages = await channel.messages.fetch({ limit: 100 });
      for (const message of messages.values()) {
        await message.delete();
      }
      deleted = messages.size;
    } while (deleted > 0);
}

export default async function (msg: Message, args: string[]) {

  const channel = msg.channel;
  const limit = args[0];

  if (!(channel instanceof TextChannel)) {
    return;
  }


  if (channel.messages.cache.size > 0) {
    await nukeChannel(channel);
  }

  type DiscordID = string;
  type Point = number;
  const players = new Map<DiscordID, Point>()
  const activities = await getActivities();
  const convertTable = await getConvertTable();
  activities.forEach(activity => {
    const tag = `${activity.ValueType}-${activity.ChallengeID}`;
    const multiplier = convertTable.get(tag) || 1;
    const point = multiplier * activity.Value;
    const id = activity.DiscordID;


    if (!players.has(activity.DiscordID)) {
      players.set(id, point);
    }

    const acc = players.get(activity.DiscordID)!;
    players.set(id, acc + point);
  })

  const playerList: { user: string, point: number }[] = [];

  players.forEach((point, user) => playerList.push({ user, point }));

  const cards = playerList
    .sort((a, b) => b.point - a.point)

  // REMEMBER TO REMOVE THIS!!!!
  let i = 0;
  for (const card of cards) {

    const member = channel.guild.members.cache.get(card.user.toString());
    if (!member) {
      continue;
    }

    if (limit && i === parseInt(limit)) {
      break;
    }

    const attachment = await createProfile(member, card.point, { 
      rank: i + 1,
      image: backgrounds[i],
    });
    await msg.channel.send(attachment);
    i++;
  }

}
