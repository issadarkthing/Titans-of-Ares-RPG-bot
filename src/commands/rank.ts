import { TextChannel, GuildMember, Message } from "discord.js";
import { getUsers } from "../db/getUsers";
import createProfile from "../internals/createProfile";
import { RANK_CHANNEL } from "../index";
import { getTotalPoints } from "../db/getTotalPoints";

export const backgrounds = [
  "https://cdn.discordapp.com/attachments/576986467084140557/852842157417168916/iu.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/852845125487165450/iu.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/852845125487165450/iu.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/852846797041696798/iu.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/852846797041696798/iu.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/852846797041696798/iu.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/852846797041696798/iu.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/852846797041696798/iu.png",
  "https://cdn.discordapp.com/attachments/576986467084140557/852846797041696798/iu.png",
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

export default async function (
  msg: Message, 
  args: string[], 
) {

  const channel = msg.guild?.channels.resolve(RANK_CHANNEL!);
  if (!channel) throw Error("No rank channel");

  const limit = args[0];

  if (!(channel instanceof TextChannel)) {
    return;
  }

  const messages = await channel.messages.fetch();

  if (messages.size > 0) {
    await nukeChannel(channel);
  }

  const users = await getUsers();
  const cards: { member: GuildMember, point: number }[] = [];

  await channel.guild.members.fetch();

  for (const user of users) {

    let member = channel.guild.members.cache.get(user.DiscordID);
    if (!member) {
        continue;
    }

    const point = await getTotalPoints(user.DiscordID);
    cards.push({ member, point })
  }

  cards.sort((a, b) => b.point - a.point);


  let i = 0;
  const files = [];
  for (const card of cards) {

    if (limit && i >= parseInt(limit)) {
      break;
    }

    const attachment = await createProfile(card.member, { 
      rank: i + 1,
      image: backgrounds[i],
    });
    
    files.push(attachment.setName(i.toString() + ".png"));
    i++;
  }

  await channel.send({ files });
}
