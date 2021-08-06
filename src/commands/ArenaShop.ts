import { Message, MessageEmbed } from "discord.js";
import { BROWN, RED_BUTTON, RETURN_BUTTON, WHITE_BUTTON } from "../internals/utils";
import { Player } from "../internals/Player";
import { ArenaScroll } from "../internals/Scroll";
import { ButtonHandler } from "../internals/ButtonHandler";
import { ArenaGear } from "../internals/ArenaGear";
import { BLUE_BUTTON } from "../internals/utils";
import { addInventory } from "../db/inventory";
import { addGear } from "../db/gear";
import { Gear } from "../internals/Gear";
import { oneLine, stripIndents } from "common-tags";
import { PREFIX } from "../main";
import { Dragon } from "../internals/Pet";
import { Fragment } from "../internals/Fragment";
import Command from "../internals/Command";

export default class extends Command {
  name = "arenashop";

  async exec(msg: Message, args: string[]) {

    const index = args[0];
    const indexInt = parseInt(index);
    const player = await Player.getPlayer(msg.member!);
    const scroll = new ArenaScroll();
    const fragments = Fragment.all.filter(x => x.id !== (new Dragon()).fragment.id);
    const dragonFragment = new Dragon().fragment;
    const items = [...ArenaGear.all, scroll, ...fragments, dragonFragment];

    if (index && indexInt) {
      const item = items[indexInt - 1];
      if (!item) return msg.channel.send("Item does not exist");

      const count = player.inventory.all.count(item.id);
      const isEquipped = player.equippedGears.get(item.id);

      const embed = item.show(count + (isEquipped ? 1 : 0));
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
      } else if (item instanceof ArenaScroll) {
        const buyMany = (count: number) => {
          return async () => {

            const totalPrice = item.price * count;
            if (player.coins < totalPrice) {
              return msg.channel.send(`Insufficient amount of arena coins`);
            }

            await player.addArenaCoin(-totalPrice);
            await addInventory(player.id, item.id, count);

            msg.channel.send(
              `Successfully purchased **x${count} ${item.name}**!`
            );
          };
        };

        menu.addButton(BLUE_BUTTON, "buy 1 scroll", buyMany(1));
        menu.addButton(RED_BUTTON, "buy 10 scrolls", buyMany(10));
        menu.addButton(WHITE_BUTTON, "buy 100 scrolls", buyMany(100));
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

    list += `\n\n12. ${scroll.name} | \`${scroll.price}\``;

    list += "\n";
    let i = 13;
    for (const fragment of fragments) {
      list += `\n${i}. ${fragment.name} | \`30\``;
      i++;
    }

    list += `\n${i} ${dragonFragment.name} | \`45\``;

    const description = oneLine`Arena full set bonus penetrates 20%/40%/60% of
                    opponents first hit (Full set +0, +5 or +10)`

    const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Arena Shop")
    .setDescription(description)
    .addField("---", list)
    .addField(
      "\u200b",
      stripIndents`
      Current coins: \`${player.coins}\`
      You can inspect an item by using \`${PREFIX}arenashop <number>\``
    );

    msg.channel.send(embed);
  }
}

