import { Message, MessageEmbed } from "discord.js";
import { BROWN } from "../internals/utils";


// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function arenaShop(msg: Message, _args: string[]) {

  const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Arena Coin Shop")
    .addField("---", "none");

  msg.channel.send(embed);
}
