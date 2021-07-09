import { Message, MessageEmbed } from "discord.js";
import { Player } from "../internals/Player";
import { BROWN, STAR } from "../internals/utils";



export async function pet(msg: Message, args: string[]) {

  const player = await Player.getPlayer(msg.member!);
  const [index] = args;

  if (index) {
    if (Number.isNaN(parseInt(index)))
      return msg.channel.send("Please give valid number");

    const pet = player.pets[parseInt(index) - 1];
    if (!pet)
      return msg.channel.send("Please give valid index");

    return msg.channel.send(pet.card);
  }

  const petsList = player.pets
    .map((x, i) => `${i + 1}. \`${x.name} ${x.star} ${STAR}\``)
    .join("\n");

  const embed = new MessageEmbed()
    .setColor(BROWN)
    .addField("Pet", petsList || "none")

  msg.channel.send(embed);
}
