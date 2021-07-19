import { Message, MessageEmbed } from "discord.js";
import { Armor } from "../internals/Armor";
import { ButtonHandler } from "../internals/ButtonHandler";
import { BLUE_BUTTON, BROWN, WHITE_BUTTON } from "../internals/utils";



export function shop(msg: Message, args: string[]) {

  const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Shop")
    .setDescription("Buy items")


  const menu = new ButtonHandler(msg, embed, msg.author.id);

  menu.addButton(BLUE_BUTTON, "coin shop", () => {
    const items = Armor.all;
    const list = items.map((x, i) => `${i + 1}. ${x.name}`).join("\n");
    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle("Coin Shop")
      .addField("---", list)

    msg.channel.send(embed);
  })

  menu.addButton(WHITE_BUTTON, "arena coin shop", () => {
    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle("Arena Coin Shop")
      .addField("---", "none")

    msg.channel.send(embed);
  })

  menu.run();
}
