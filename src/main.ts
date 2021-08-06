import { verbose } from 'sqlite3';
import { Client, TextChannel } from 'discord.js';
import path from 'path';
import { xpLog } from "./internals/xpLog";
import { schema } from "./db/schema";
import { energyMainLoop } from './internals/energy';
import { Buff } from './internals/Buff';
import Rank from "./commands/Rank";
import { CommandManager } from "./internals/Command";

const sqlite3 = verbose();
export const PREFIX = process.env.PREFIX!;
export const OLD_BOT_ID = process.env.OLD_BOT_ID!;
export const RANK_CHANNEL = process.env.RANK_CHANNEL!;
export const XP_LOG_CHANNEL = process.env.XP_LOG_CHANNEL!;
export const DB = process.env.DB!;
export const SERVER_ID = process.env.SERVER_ID!;
export const DEV_ID = process.env.DEV_ID!;

export const db = new sqlite3.Database(path.resolve(__dirname, DB));
export const client = new Client();
export const onMultiUpgrade = new Set<string>();
const commandManager = new CommandManager();

// create necessary tables if not exist
db.exec(schema);

setInterval(() => {
  energyMainLoop();
  Buff.mainLoop();
}, 1000) // run every second

const initial = performance.now();
commandManager
  .registerCommands(path.resolve(__dirname, "./commands"))
  .then(() => {
    const timeTaken = performance.now() - initial;
    console.log(`Registering commands took ${timeTaken.toFixed(4)} ms`);
  })

// stores discord id of user that triggers the xp log
export let xpLogTriggers = "";

export let logChannel: TextChannel;

client.once('ready', async () => {
  console.log('Bot is ready');
  const guild = await client.guilds.fetch(SERVER_ID);
  logChannel = guild.channels.cache.get(XP_LOG_CHANNEL) as TextChannel;
})


client.on('message', (msg) => {

  const words = msg.content.split(' ');
  const command = words[0];
  const args = words.slice(1);

  if (
    msg.content.startsWith("Registered") 
    && (msg.author.id === OLD_BOT_ID || msg.author.id === DEV_ID)
  ) {
    const rank = new Rank();
    rank.exec(msg, ["10"]);
    xpLog(msg);
    
  } else if (command.startsWith("!") && !msg.author.bot) {
    xpLogTriggers = msg.author.id;

  } else if (!command.startsWith(PREFIX) || msg.author.bot) {
    return;
  }

  const cmd = command.replace(PREFIX, '').toLowerCase();
  commandManager.handleMessage(cmd, msg, args);
})
