import { oneLine, stripIndents } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { addGear } from "../db/gear";
import { addInventory } from "../db/inventory";
import { ArenaGear } from "../internals/ArenaGear";
import { ButtonHandler } from "../internals/ButtonHandler";
import Command from "../internals/Command";
import { Fragment } from "../internals/Fragment";
import { Gear } from "../internals/Gear";
import { Dragon } from "../internals/Pet";
import { Player } from "../internals/Player";
import { BLUE_BUTTON, BROWN, RETURN_BUTTON } from "../internals/utils";
import { client } from "../main";

export default class extends Command {
  name = "arenashop";

  async exec(msg: Message, args: string[]) {

    const index = args[0];
    const indexInt = parseInt(index);
    const player = await Player.getPlayer(msg.member!);
    const fragments = Fragment.all.filter(x => x.id !== (new Dragon()).fragment.id);
    const dragonFragment = new Dragon().fragment;
    const items = [...ArenaGear.all, ...fragments, dragonFragment];

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
      list += `\n${i}. ${fragment.name} | \`30\``;
      i++;
    }

    list += `\n${i} ${dragonFragment.name} | \`45\``;

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

