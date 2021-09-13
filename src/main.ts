import { TextChannel } from 'discord.js';
import path from 'path';
import { xpLog } from "./internals/xpLog";
import { energyMainLoop } from './internals/energy';
import { Buff } from './internals/Buff';
import Rank from "./commands/Rank";
import Client from "./internals/Client";
import { TeamArena } from "./internals/TeamArena";

export const client = new Client(path.resolve(__dirname, process.env.DB!));

client.commandManager.verbose = true;

client.addBlockingPollHandler(energyMainLoop);
client.addBlockingPollHandler(Buff.mainLoop);
client.addBlockingPollHandler(TeamArena.mainLoop);

client.commandManager.registerCommands(path.resolve(__dirname, "./commands"));

client.bot.once('ready', async () => {
  console.log('Bot is ready');
  const guild = await client.bot.guilds.fetch(client.serverID);
  const channels = guild.channels.cache;
  client.logChannel = channels.get(client.xpLogChannelID) as TextChannel;
  client.teamArenaChannel = channels.get(client.teamArenaChannelID) as TextChannel;
  client.startPollEvent();
})

client.bot.on('message', (msg) => {

  const words = msg.content.split(' ');
  const command = words[0];
  const args = words.slice(1);

  if (
    msg.content.startsWith("Registered") 
    && (msg.author.id === client.oldBotID || msg.author.id === client.devID)
  ) {
    const rank = new Rank();
    rank.exec(msg, []);
    xpLog(msg);
    
  } else if (command.startsWith("!") && !msg.author.bot) {
    client.xpLogTriggers = msg.author.id;

  } else if (!command.startsWith(client.prefix) || msg.author.bot) {
    return;
  }

  const cmd = command.replace(client.prefix, '').toLowerCase();
  client.commandManager.handleMessage(cmd, msg, args);
})
