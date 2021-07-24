import { Message, MessageEmbed } from "discord.js";
import { BROWN } from "../internals/utils";


export function arenaShop(msg: Message, args: string[]) {

  const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Arena Coin Shop")
    .addField("---", "none");

  msg.channel.send(embed);
}
