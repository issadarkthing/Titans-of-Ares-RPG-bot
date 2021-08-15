import { Message, MessageEmbed } from "discord.js";
import { ButtonHandler } from "../internals/ButtonHandler";
import {
  BLUE_BUTTON,
  BROWN,
  WHITE_BUTTON,
} from "../internals/utils";
import CoinShop from "./CoinShop";
import ArenaShop from "./ArenaShop";
import Command from "../internals/Command";
import { oneLine } from "common-tags";
import { client } from "../main";

export default class Shop extends Command {
  name = "shop";
  aliases = ["sh"];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async exec(msg: Message, _args: string[]) {

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle("Shop")
      .setDescription("Please select shop you want to open")
      .addField("\u200b", 
        oneLine`This will open all the possible shops. You can buy gear
        and upgrade scrolls here. When you buy items from the shop, they
        will appear in the \`${client.prefix}inventory\``)

    const menu = new ButtonHandler(msg, embed, msg.author.id);
    const coinShop = new CoinShop();
    const arenaShop = new ArenaShop();

    menu.addButton(BLUE_BUTTON, "coin shop", () => coinShop.exec(msg, []));
    menu.addButton(WHITE_BUTTON, "arena coin shop", () => arenaShop.exec(msg, []));

    menu.addCloseButton();
    menu.run();
  }
}

