import { oneLine } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { db, PREFIX } from "..";
import { addInventory } from "../db/inventory";
import { Gear } from "../internals/Gear";
import { ButtonHandler } from "../internals/ButtonHandler";
import { Player } from "../internals/Player";
import { BLUE_BUTTON, BROWN, RED_BUTTON, RETURN_BUTTON, WHITE_BUTTON } from "../internals/utils";
import { Scroll } from "../internals/Scroll";
import { addGear } from "../db/gear";



export async function shop(msg: Message, args: string[]) {

  const shopType = args[0];
  const index = args[1];
  const indexInt = parseInt(index);

  if (shopType === "coin" && index && indexInt) {
    const scroll = new Scroll();
    const item = [...Gear.all, scroll][indexInt - 1];
    if (!item) return msg.channel.send("Item does not exist");

    const player = await Player.getPlayer(msg.member!);
    const count = player.inventory.all.count(item.id);

    const embed = item.show(count);
    const menu = new ButtonHandler(msg, embed, player.id);

    // only show if player does not have the item
    if (count === 0 && item instanceof Gear) {
      menu.addButton(BLUE_BUTTON, "buy item", async () => {
        player.addCoin(-item.price);
        const inventoryID = await addInventory(player.id, item.id);
        addGear(inventoryID);

        msg.channel.send(
          `Successfully purchased **${item.name}**!`
        )
      })

    } else if (item instanceof Scroll) {

      const buyMany = (count: number) => {
        return async () => {

          db.run("BEGIN TRANSACTION");
          for (let i = 0; i < count; i++) {
            await player.addCoin(-item.price);
            await addInventory(player.id, item.id);
          }
          db.run("COMMIT");

          msg.channel.send(
            `Successfully purchased **x${count} ${item.name}**!`
          )
        }
      }

      menu.addButton(BLUE_BUTTON, "buy 1 scroll", buyMany(1));
      menu.addButton(WHITE_BUTTON, "buy 5 scroll", buyMany(5));
      menu.addButton(RED_BUTTON, "buy 10 scroll", buyMany(10));

    }

    menu.addButton(RETURN_BUTTON, "return back to menu", () => {
      shop(msg, ["coin"]);
    })

    menu.addCloseButton();
    menu.run();

    return;
  }

  const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Shop")
    .setDescription("Buy items")


  const menu = new ButtonHandler(msg, embed, msg.author.id);

  const coinShop = () => {
    const items = Gear.all;
    let list = items
      .map((x, i) => `${i + 1}. ${x.name} \`${x.description}\` \`${x.price}\``)
      .join("\n");

    const scroll = new Scroll();
    list += `\n\n12. ${scroll.name} \`+1 gear level\` \`${scroll.price}\``
    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle("Coin Shop")
      .addField("---", list)
      .addField("\u200b", 
        oneLine`You can inspect an item by using \`${PREFIX}shop coin <number>\``)

    msg.channel.send(embed);
  }

  const arenaShop = () => {
    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle("Arena Coin Shop")
      .addField("---", "none")

    msg.channel.send(embed);
  }

  if (shopType === "coin") {
    coinShop();
    return;
  } else if (shopType === "arena") {
    arenaShop();
    return;
  }

  menu.addButton(BLUE_BUTTON, "coin shop", coinShop);
  menu.addButton(WHITE_BUTTON, "arena coin shop", arenaShop);

  menu.addCloseButton();
  menu.run();
}
