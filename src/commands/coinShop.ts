import { oneLine } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { db, PREFIX } from "..";
import { addGear } from "../db/gear";
import { addInventory } from "../db/inventory";
import { ButtonHandler } from "../internals/ButtonHandler";
import { Gear } from "../internals/Gear";
import { Player } from "../internals/Player";
import { Scroll } from "../internals/Scroll";
import { BLUE_BUTTON, BROWN, RED_BUTTON, RETURN_BUTTON, WHITE_BUTTON } from "../internals/utils";



export async function coinShop(msg: Message, args: string[]) {

  const index = args[0];
  const indexInt = parseInt(index);

  if (index && indexInt) {
    const scroll = new Scroll();
    const item = [...Gear.all, scroll][indexInt - 1];
    if (!item) return msg.channel.send("Item does not exist");

    const player = await Player.getPlayer(msg.member!);
    const count = player.inventory.all.count(item.id);
    const isEquipped = player.equippedGears.get(item.id);

    const embed = item.show(count + (isEquipped ? 1 : 0));
    const menu = new ButtonHandler(msg, embed, player.id);

    // only show if player does not have the item
    if (!isEquipped && count === 0 && item instanceof Gear) {
      menu.addButton(BLUE_BUTTON, "buy item", async () => {
        if (player.coins < item.price) {
          return msg.channel.send(`Insufficient amount of coins`);
        }

        player.addCoin(-item.price);
        const inventoryID = await addInventory(player.id, item.id);
        addGear(inventoryID);

        msg.channel.send(`Successfully purchased **${item.name}**!`);
      });
    } else if (item instanceof Scroll) {
      const buyMany = (count: number) => {
        return async () => {
          db.run("BEGIN TRANSACTION");
          for (let i = 0; i < count; i++) {
            if (player.coins < item.price) {
              return msg.channel.send(`Insufficient amount of coins`);
            }
            await player.addCoin(-item.price);
            await addInventory(player.id, item.id);
          }
          db.run("COMMIT");

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
      coinShop(msg, []);
    });

    menu.addCloseButton();
    menu.run();

    return;
  }

  const items = Gear.all;
  let list = items
    .map((x, i) => `${i + 1}. ${x.name} \`${x.description}\` | \`${x.price}\``)
    .join("\n");

  const scroll = new Scroll();
  list += `\n\n12. ${scroll.name} | \`${scroll.price}\``;

  const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Coin Shop")
    .setDescription(oneLine`Apprentice full set bonus reflects 10%/30%/50% of
      opponents first hit (Full set +0, +5 or +10)`)
    .addField("---", list)
    .addField(
      "\u200b",
      oneLine`You can inspect an item by using \`${PREFIX}coinshop <number>\``
    );

  msg.channel.send(embed);
}
