import { stripIndents } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { PREFIX } from "..";
import { Pet } from "../internals/Pet";
import { Player } from "../internals/Player";
import { BROWN, STAR } from "../internals/utils";



export async function pet(msg: Message, args: string[]) {

  const player = await Player.getPlayer(msg.member!);
  const [index] = args;

  if (index === "all") {
    const ownedPets = player.pets;
    const ownedPetsID = player.pets.map(x => x.id);
    const notOwnedPets = Pet.all.filter(x => !ownedPetsID.includes(x.id));
    const allPets = [...ownedPets, ...notOwnedPets];

    for (const pet of allPets) {
      const fragmentCount = player.inventory.getItemCount(`fragment_${pet.id}`);
      msg.channel.send(pet.card(fragmentCount, true));
    }

    return

  } else if (index) {
    if (Number.isNaN(parseInt(index)))
      return msg.channel.send("Please give valid number");

    const pet = player.pets[parseInt(index) - 1];
    if (!pet)
      return msg.channel.send("Please give valid index");

    const fragmentCount = player.inventory.getItemCount(`fragment_${pet.id}`);
    return msg.channel.send(pet.card(fragmentCount, true));

  }

  const petsList = player.pets
    .map((x, i) => `${i + 1}. \`${x.name} ${x.star} ${STAR}\``)
    .join("\n");

  const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Pet")
    .setDescription("Showing all pets you own")
    .addField("---", petsList || "none")
    .addField("\u200b", stripIndents`
      Use command \`${PREFIX}pet all\` to show all pets available and that are available to summon/upgrade
      You can summon or upgrade pets from inventory using \`${PREFIX}inventory\``)

  msg.channel.send(embed);
}
