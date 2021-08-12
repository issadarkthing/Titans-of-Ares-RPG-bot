import { oneLine, stripIndents } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { addGear } from "../db/gear";
import { addInventory } from "../db/inventory";
import { ArenaGear } from "../internals/ArenaGear";
import { ButtonHandler } from "../internals/ButtonHandler";
import Command from "../internals/Command";
import { Fragment } from "../internals/Fragment";
import { Gear } from "../internals/Gear";
import { Player } from "../internals/Player";
import { BLUE_BUTTON, BROWN, RED_BUTTON, RETURN_BUTTON, WHITE_BUTTON } from "../internals/utils";
import { client } from "../main";

export default class extends Command {
  name = "arenashop";
  aliases = ["ash"];

  async exec(msg: Message, args: string[]) {

    const index = args[0];
    const indexInt = parseInt(index);
    const player = await Player.getPlayer(msg.member!);
    const fragments = Fragment.all;
    const items = [...ArenaGear.all, ...Fragment.all];

    if (index && indexInt) {
      const item = items[indexInt - 1];
      if (!item) return msg.channel.send("Item does not exist");

      const count = player.inventory.all.count(item.id);
      const isEquipped = player.equippedGears.get(item.id);

      let embed = item.show(count + (isEquipped ? 1 : 0));
      if (item instanceof Fragment) {
        embed = item.show(count, { price: true });
      }

      const menu = new ButtonHandler(msg, embed, player.id);

      // only show if player does not have the item
      if (!isEquipped && count === 0 && item instanceof Gear) {
        menu.addButton(BLUE_BUTTON, "buy item", async () => {
          if (player.arenaCoins < item.price) {
            return msg.channel.send(`Insufficient amount of arena coins`);
          }

          player.addArenaCoin(-item.price);
          const inventoryID = await addInventory(player.id, item.id);
          addGear(inventoryID);

          msg.channel.send(`Successfully purchased **${item.name}**!`);
        });

      } else if (item instanceof Fragment) {
        const buyMany = (count: number) => {
          return async () => {

            const totalPrice = item.price * count;
            if (player.arenaCoins < totalPrice) {
              return msg.channel.send(`Insufficient amount of coins`);
            }
              
            await player.addArenaCoin(-totalPrice);
            await addInventory(player.id, item.id, count);

            msg.channel.send(
              `Successfully purchased **x${count} ${item.name}**!`
            );
          };
        };

        menu.addButton(BLUE_BUTTON, "buy 1 fragment", buyMany(1));
        menu.addButton(RED_BUTTON, "buy 10 fragments", buyMany(10));
        menu.addButton(WHITE_BUTTON, "buy 100 fragments", buyMany(100));

      }


      menu.addButton(RETURN_BUTTON, "return back to menu", () => {
        this.exec(msg, []);
      });

      menu.addCloseButton();
      menu.run();

      return;
    }

    let list = ArenaGear.all
    .map((x, i) => `${i + 1}. ${x.name} \`${x.description}\` | \`${x.price}\``)
    .join("\n");

    list += "\n";
    let i = 12;
    for (const fragment of fragments) {
      list += `\n${i}. ${fragment.name} | \`${fragment.price}\``;
      i++;
    }

    const description = oneLine`Arena full set bonus penetrates +20%/40%/60% of
                    armor penetration (Full set +0, +5 or +10)`

    const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Arena Shop")
    .setDescription(description)
    .addField("---", list)
    .addField(
      "\u200b",
      stripIndents`
      Current arena coins: \`${player.arenaCoins}\`
      You can inspect an item by using \`${client.prefix}arenashop <number>\``
    );

    msg.channel.send(embed);
  }
}

