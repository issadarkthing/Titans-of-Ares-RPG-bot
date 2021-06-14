import { verbose } from 'sqlite3';
import { Client } from 'discord.js';
import path from 'path';
import { profile } from "./commands/profile";
import rank from "./commands/rank";
import help from './commands/help';
import { xpLog } from "./commands/xpLog";

const sqlite3 = verbose()
export const db = new sqlite3.Database(path.resolve(__dirname, '../MainDB.db'));
const PREFIX = process.env.PREFIX;
const OLD_BOT_ID = process.env.OLD_BOT_ID;
export const RANK_CHANNEL = process.env.RANK_CHANNEL;
export const XP_LOG_CHANNEL = process.env.XP_LOG_CHANNEL;

if (!PREFIX) {
  throw new Error('No command prefix');
} else if (!RANK_CHANNEL) {
  throw new Error('No rank channel');
} else if (!XP_LOG_CHANNEL) {
  throw new Error('No xp log channel');
}

const client = new Client();

// stores discord id of user that triggers the xp log
export let xpLogTriggers = "";

client.once('ready', () => {
  console.log('Bot is ready');
})


client.on('message', (msg) => {

  const words = msg.content.split(' ');
  const command = words[0];
  const args = words.slice(1);

  if (
    msg.content.startsWith("Registered") 
    && msg.author.id === OLD_BOT_ID
  ) {
    rank(msg, []);
    xpLog(msg, []);
    
  } else if (command.startsWith("!") && !msg.author.bot) {
    xpLogTriggers = msg.author.id;

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
    case 'help':
      help(msg, args);
      break;
  }
})

client.login(process.env.BOT_TOKEN);
