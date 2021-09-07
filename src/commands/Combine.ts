import { Message } from "discord.js";
import Command from "../internals/Command";
import { List } from "../internals/List";
import { Gem } from "../internals/Mining";
import { Player } from "../internals/Player";

export default class Combine extends Command {
  name = "combine";
  aliases = ["comb"];

  async exec(msg: Message, args: string[]) {

    const [arg1, ...args2] = args;
    const quality = arg1.toLowerCase();
    const indexes = args2.map(x => parseInt(x));

    if (!Gem.isValidQuality(quality))
      return msg.channel.send("invalid Gem quality");
    else if (indexes.some(x => Number.isNaN(x)))
      return msg.channel.send("invalid index was given");

    const player = await Player.getPlayer(msg.member!);

    let gems = player.inventory.stones
      .filter(x => x instanceof Gem) as Gem[];

    gems = gems.filter(x => x.quality === quality);

    if (gems.length <= 0)
      return msg.channel.send(`You don't have any gem of ${quality} quality`);

    const gemList = List.from(gems).aggregate();
    const selected = indexes.map(x => gemList[x - 1]);

    for (let i = 0; i < selected.length; i++) {
      const gem = selected[i];
      if (!gem) 
        return msg.channel.send(`cannot find gem on index ${indexes[i]}`);

      const count = gem.count;
      await msg.channel.send(gem.value.show(count));
    }
  }
}
