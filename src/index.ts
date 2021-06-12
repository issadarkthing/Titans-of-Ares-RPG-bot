import { verbose } from 'sqlite3';
import { Client } from 'discord.js';
import path from 'path';
import { profile } from "./commands/progress";

const sqlite3 = verbose()
export const db = new sqlite3.Database(path.resolve(__dirname, '../MainDB.db'));
const PREFIX = process.env.PREFIX;

if (!PREFIX) {
  throw new Error('No command prefix');
}

const client = new Client();

client.once('ready', () => {
  console.log('Bot is ready');
})

client.on('message', (msg) => {

  const words = msg.content.split(' ');
  const command = words[0];
  const args = words.slice(1);

  if (!command.startsWith(PREFIX) || msg.author.bot) {
    return;
  }

  const cmd = command.replace(PREFIX, '');
  switch (cmd) {
    case 'progress':
      profile(msg, args);
      break;
  }
})

client.login(process.env.BOT_TOKEN);
