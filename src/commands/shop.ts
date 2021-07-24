import { Message, MessageEmbed } from "discord.js";
import { ButtonHandler } from "../internals/ButtonHandler";
import {
  BLUE_BUTTON,
  BROWN,
  WHITE_BUTTON,
} from "../internals/utils";
import { coinShop } from "./coinShop";
import { arenaShop } from "./arenaShop";

export async function shop(msg: Message, args: string[]) {

  const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Shop")
    .setDescription("Please select shop you want to open");

  const menu = new ButtonHandler(msg, embed, msg.author.id);

  menu.addButton(BLUE_BUTTON, "coin shop", () => coinShop(msg, []));
  menu.addButton(WHITE_BUTTON, "arena coin shop", () => arenaShop(msg, []));

  menu.addCloseButton();
  menu.run();
}
