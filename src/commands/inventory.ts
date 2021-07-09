import { Message, MessageEmbed } from "discord.js";
import { Chest } from "../internals/Chest";
import { Fragment, FragmentID } from "../internals/Fragment";
import { Player } from "../internals/Player";
import { aggregateBy, GOLD } from "../internals/utils";
import { sleep } from "../internals/battle";

export async function inventory(msg: Message, args: string[]) {

  const player = await Player.getPlayer(msg.member!);
  const inventory = player.inventory;
  const acc = inventory.itemsCount();
  const [index] = args;

  if (index) {

    const i = parseInt(index) - 1;
    const [, subcmd] = args;
    if (Number.isNaN(i))
      return msg.channel.send("Please give valid index");

    const accItem = acc[i];
    if (!accItem)
      return msg.channel.send(`No item found at index ${i}`);

    if (subcmd.toLowerCase() === "use") {
      const item = inventory.getItem(accItem.id)!;

      if (item instanceof Chest) {
        const result = await item.use(player);
        await player.sync();

        const chestOpening = await msg.channel.send(item.openChestAnimation());
        await sleep(4000);
        await chestOpening.delete();

        const cards: MessageEmbed[] = [];
        const aggregated = aggregateBy(result, x => x.id);
        const fragment = Object.entries(aggregated)
          .map(([id, count]) => { 

            const fragment = new Fragment(id as FragmentID);
            const pet = fragment.pet;
            const ownedFragmentCount = player.inventory.getItemCount(id);
            cards.push(pet.fragmentCard(ownedFragmentCount));
            return `\`x${count}\` **${fragment.name}**`;
          })
          .join(" ");

        msg.channel.send(`You got ${fragment}!`);
        cards.forEach(x => msg.channel.send(x));
      }

    } else {
      return msg.channel.send("Invalid action")
    }

    return;
  }

  const itemsList = acc.reduce((acc, v, i) => {
    return acc + `\n${i + 1}. \`x${v.count} ${v.name}\``;
  }, "").trim();

  const embed = new MessageEmbed()
    .setColor(GOLD)
    .addField("Inventory", itemsList || "None");

  msg.channel.send(embed);
}
