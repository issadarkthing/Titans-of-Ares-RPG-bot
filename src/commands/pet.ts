import { stripIndents } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { PREFIX } from "..";
import { setActivePet, setInactivePet } from "../db/pet";
import { ButtonHandler } from "../internals/ButtonHandler";
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
      const fragmentCount = player.inventory.all.count(`fragment_${pet.id}`);
      msg.channel.send(pet.card(fragmentCount, true));
    }

    return

  } else if (index) {
    if (Number.isNaN(parseInt(index)))
      return msg.channel.send("Please give valid number");

    const pet = player.pets.get(parseInt(index) - 1);
    if (!pet)
      return msg.channel.send("Please give valid index");

    const fragmentCount = player.inventory.all.count(`fragment_${pet.id}`);
    const petCard = pet.card(fragmentCount, true);
    const button = new ButtonHandler(msg, petCard, player.id);

    button.addButton("🔵", "activate this pet", () => {
      setActivePet(player.id, pet.id);
      msg.channel.send(`**${pet.name}** is now your active pet!`);
    })

    button.addButton("🔴", "deactivate current active pet", () => {
      if (!player.activePet)
        return msg.channel.send("You currently have no active pet");

      setInactivePet(player.id);
      msg.channel.send(
        `**${player.activePet?.name}** has been removed as your active pet!`
      );
    })

    button.addCloseButton();
    await button.run();

    return;
  }

  const petsList = player.pets
    .map((x, i) => `${i + 1}. \`${x.name} ${x.star} ${STAR}\``)
    .join("\n");

  const embed = new MessageEmbed()
    .setColor(BROWN)
    .setTitle("Pet")
    .setDescription("Showing all pets you summoned")
    .addField("---", petsList || "none")
    .addField("\u200b", stripIndents`
      You can inspect your summoned pet by using \`${PREFIX}pet <number>\`
      Use command \`${PREFIX}pet all\` to show all existing pets and how many fragments you need to summon or upgrade them
      You can summon or upgrade pets from inventory using \`${PREFIX}inventory\`
      You can convert pet fragments from the inventory using \`${PREFIX}inventory\``)

  msg.channel.send(embed);
}
