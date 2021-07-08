import { Message, MessageEmbed } from "discord.js";
import { Player } from "../internals/Player";
import { GOLD } from "../internals/utils";


export async function inventory(msg: Message, args: string[]) {

  const player = await Player.getPlayer(msg.member!);
  const inventory = player.inventory;
  const acc = inventory.itemsCount();
  const [index] = args;

  if (index) {

    const i = parseInt(index);
    const [, subcmd] = args;
    if (!i)
      return msg.channel.send("Please give valid index");

    const accItem = acc[i];
    if (!accItem)
      return msg.channel.send(`No item found at index ${i}`);

    if (subcmd.toLowerCase() === "use") {
      const item = inventory.getItem(accItem.id)!;
      const result = await item.use(player);
      if (result) {
        const [fragment, count] = result;
        msg.channel.send(`You got x${count} **${fragment.name}**!`);
      }

    } else {
      return msg.channel.send("Invalid action")
    }
  }

  const itemsList = acc.reduce((acc, v, i) => {
    return acc + `\n${i + 1}. \`x${v.count} ${v.name}\``;
  }, "").trim();

  const embed = new MessageEmbed()
    .setColor(GOLD)
    .addField("Inventory", itemsList || "None");

  msg.channel.send(embed);
}
