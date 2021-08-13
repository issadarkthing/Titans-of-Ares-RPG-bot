import { Message, TextChannel } from "discord.js";
import { getUsers } from "../db/player";
import Command from "../internals/Command";
import { Player } from "../internals/Player";
import { nukeChannel } from "../internals/utils";
import { client } from "../main";

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

export default class extends Command {
  name = "rank";
  block = true;

  async exec(msg: Message, args: string[]) {

    const author = msg.author;
    const channel = msg.guild?.channels.resolve(client.rankChannelID);
    if (!channel) throw Error("No rank channel");


    if (!(channel instanceof TextChannel)) {
      return;
    }

    const messages = await channel.messages.fetch();
    let count = 10;

    const rankCount = parseInt(args[0]);

    if (rankCount) {
      count = rankCount;
    }

    channel.startTyping();
    const users = await getUsers();

    await channel.guild.members.fetch();

    const playersPromise = users
      .map(user => channel.guild.members.cache.get(user.DiscordID)!)
      .filter(member => !!member)
      .map(member =>  Player.getPlayer(member));

    let players = await Promise.all(playersPromise);

    players.sort((a, b) => b.xp - a.xp);
    players = players.slice(0, count);

    const files = await Promise.all(players.map(x => x.getProfile()));
    channel.stopTyping();

    if (args.length === 0) {
      if (messages.size > 0) {
        await nukeChannel(channel);
      }

      await channel.send({ files });

    } else if (args.length > 0) {
      try {

        const dmChannel = await author.createDM();
        await nukeChannel(dmChannel);

        for (const file of files) {
          await author.send(file);
        }
      // eslint-disable-next-line no-empty
      } catch {}
    }
  }
}
