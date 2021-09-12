import { Message } from "discord.js";
import { addGem } from "../db/gem";
import Command from "../internals/Command";
import { Legendary } from "../internals/Mining";
import { Player } from "../internals/Player";
import { client } from "../main";


export default class extends Command {
  name = "test";
  aliases = ["t"]

  // eslint-disable-next-line
  async exec(msg: Message, _args: string[]) {

    if (!client.isDev) return;

    const player = await Player.getPlayer(msg.member!);

    for (let i = 0; i < 10; i++) {
      const gem = Legendary.random();
      await addGem(player.id, gem.id);
      await msg.channel.send(`You got ${gem.name}!`);
      await msg.channel.send(gem.show(-1));
    }
  }
}
