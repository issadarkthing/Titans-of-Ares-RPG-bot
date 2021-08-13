import { Message, TextChannel } from "discord.js";
import { getUsers } from "../db/player";
import Command from "../internals/Command";
import { Player } from "../internals/Player";
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

  async nukeChannel(channel: TextChannel) {
      let deleted = 0;
      do {
        const messages = await channel.messages.fetch({ limit: 100 });
        for (const message of messages.values()) {
          await message.delete();
        }
        deleted = messages.size;
      } while (deleted > 0);
  }


  async exec(msg: Message, args: string[]) {

    const channel = msg.guild?.channels.resolve(client.rankChannelID);
    if (!channel) throw Error("No rank channel");


    if (!(channel instanceof TextChannel)) {
      return;
    }

    const messages = await channel.messages.fetch();
    let count = 10;

    if (client.isDev) {
      const rankCount = parseInt(args[0]);

      if (rankCount) {
        count = rankCount;
      }
    }

    if (messages.size > 0) {
      await this.nukeChannel(channel);
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

    for (const file of files) {
      await channel.send(file);
    }
  }
}
