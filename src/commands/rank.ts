import { TextChannel, Message } from "discord.js";
import { getUsers } from "../db/getUsers";
import { RANK_CHANNEL } from "../index";
import { Player } from "../internals/Player";

const first = "https://cdn.discordapp.com/attachments/852546444086214676/860427588589846568/image0.jpg";
const second = "https://cdn.discordapp.com/attachments/574852830125359126/860430411423416360/unknown.png";
const third = "https://cdn.discordapp.com/attachments/576986467084140557/852846797041696798/iu.png";

export const backgrounds = [
  first,
  second,
  second,
  third,
  third,
  third,
  third,
  third,
  third,
  third,
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

  await channel.guild.members.fetch();

  let playersPromise = users
    .map(user => channel.guild.members.cache.get(user.DiscordID)!)
    .filter(member => !!member)
    .map(member =>  Player.getPlayer(member));

  let players = await Promise.all(playersPromise);

  players.sort((a, b) => b.points - a.points);
  players = players.slice(0, parseInt(limit) || 10);

  const files = await Promise.all(players.map(x => x.getProfile()));
  await channel.send({ files });
}
