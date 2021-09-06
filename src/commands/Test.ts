import { Message } from "discord.js";
import Command from "../internals/Command";
import { Common } from "../internals/Mining";
import { client } from "../main";


export default class extends Command {
  name = "test";
  aliases = ["t"]

  // eslint-disable-next-line
  exec(msg: Message, _args: string[]) {

    if (!client.isDev) return;

    for (const gem of Common.all) {
      msg.channel.send(gem.show(-1));
    }
  }
}
