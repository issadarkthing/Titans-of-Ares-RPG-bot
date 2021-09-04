import { Message, MessageEmbed } from "discord.js";
import Command from "../internals/Command";
import { Stone } from "../internals/Mining";
import { Player } from "../internals/Player";
import { BROWN, toNList } from "../internals/utils";

export default class extends Command {
  name = "gemcrafting";
  aliases = ["gc"];

  async exec(msg: Message, args: string[]) {
    const player = await Player.getPlayer(msg.member!);
    const itemList = player.inventory.stones.aggregate();

    const [index] = args;
    if (index) {
      const i = parseInt(index) - 1;
      if (Number.isNaN(i)) return msg.channel.send("Please give valid index");

      const accItem = itemList[i];
      if (!accItem) return msg.channel.send(`No item found at index ${index}`);

      const stone = player.inventory.stones.get(accItem.value.id)!;
      this.inspect(stone, player, msg);
      return;
    }

    const displayList = 
      toNList(itemList.map(x => `${x.value.name} \`x${x.count}\``));

    const embed = new MessageEmbed()
      .setTitle("Gem Crafting")
      .setColor(BROWN)
      .addField("---", displayList)

    msg.channel.send(embed);
  }

  private inspect(gem: Stone, player: Player, msg: Message) {
    const sameRarityGemCount = player.inventory.stones.countBy(x => x.rarity === gem.rarity);
    const gemCount = player.inventory.stones.count(gem.id);
    const gemInfo = gem.inspect(gemCount, sameRarityGemCount);
    msg.channel.send(gemInfo);
  }
}
