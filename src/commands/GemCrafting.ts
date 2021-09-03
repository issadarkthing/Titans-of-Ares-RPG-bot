import { Message, MessageEmbed } from "discord.js";
import Command from "../internals/Command";
import { Player } from "../internals/Player";
import { BROWN, toNList } from "../internals/utils";

export default class extends Command {
  name = "gemcrafting";
  aliases = ["gc"];

  // eslint-disable-next-line
  async exec(msg: Message, _args: string[]) {

    const player = await Player.getPlayer(msg.member!);
    const itemList = player.inventory.stones.aggregate();

    const displayList = 
      toNList(itemList.map(x => `${x.value.name} \`x${x.count}\``));

    const embed = new MessageEmbed()
      .setTitle("Gem Crafting")
      .setColor(BROWN)
      .addField("---", displayList)

    msg.channel.send(embed);
  }
}
