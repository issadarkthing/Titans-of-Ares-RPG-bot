import { verbose } from 'sqlite3';
import { Client, TextChannel } from 'discord.js';
import path from 'path';
import { profile } from "./commands/profile";
import rank from "./commands/rank";

const sqlite3 = verbose()
export const db = new sqlite3.Database(path.resolve(__dirname, '../MainDB.db'));
const PREFIX = process.env.PREFIX;
const OLD_BOT_ID = process.env.OLD_BOT_ID;
const RANK_CHANNEL = process.env.RANK_CHANNEL;

if (!PREFIX) {
  throw new Error('No command prefix');
} else if (!RANK_CHANNEL) {
  throw new Error('No rank channel');
}

const client = new Client();

client.once('ready', () => {
  console.log('Bot is ready');
})


client.on('message', (msg) => {

  const words = msg.content.split(' ');
  const command = words[0];
  const args = words.slice(1);

  if (command.startsWith("Registered Day") && msg.author.id === OLD_BOT_ID) {

    const rankChannel = msg.guild?.channels.cache.get(RANK_CHANNEL);
    if (!rankChannel) throw Error("No rank channel");
    if (rankChannel instanceof TextChannel) {
      rank(msg, [], rankChannel);
    }
    
  } else if (!command.startsWith(PREFIX) || msg.author.bot) {
    return;
  }

  const cmd = command.replace(PREFIX, '');
  switch (cmd) {
    case 'profile':
      profile(msg, args);
      break;
    case 'rank':
      rank(msg, args);
      break;
  }
})

client.login(process.env.BOT_TOKEN);
