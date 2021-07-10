import { Message, MessageEmbed } from "discord.js";
import { Chest } from "../internals/Chest";
import { Fragment, FragmentID } from "../internals/Fragment";
import { Player } from "../internals/Player";
import { aggregateBy, GOLD, STAR } from "../internals/utils";
import { sleep } from "../internals/battle";
import { oneLine } from "common-tags";
import { ButtonHandler } from "../internals/ButtonHandler";
import { PREFIX } from "..";

export async function inventory(msg: Message, args: string[]) {

  const player = await Player.getPlayer(msg.member!);
  const inv = player.inventory;
  const acc = inv.itemsCount();
  const [index] = args;

  if (index) {

    const i = parseInt(index) - 1;
    if (Number.isNaN(i))
      return msg.channel.send("Please give valid index");

    const accItem = acc[i];
    if (!accItem)
      return msg.channel.send(`No item found at index ${i}`);

    const item = inv.getItem(accItem.id)!;

    const button = new ButtonHandler(msg, item.show(accItem.count), player.id);

    if (item instanceof Chest) {
      button.addButton("🟢", "use the item", async () => {

        const result = await item.use(player);
        await player.sync();

        const chestOpening = await msg.channel.send(item.openChestAnimation());
        await sleep(6000);
        await chestOpening.delete();

        const cards: MessageEmbed[] = [];
        const aggregated = aggregateBy(result, x => x.id);
        const fragment = Object.entries(aggregated)
          .map(([id, count]) => { 

            const fragment = new Fragment(id as FragmentID);
            const hasPet = player.pets.find(x => x.id === fragment.pet.id);
            const pet = hasPet || fragment.pet;
            const ownedFragmentCount = player.inventory.getItemCount(id);
            const action = hasPet ? "upgrade" : "summon";
            cards.push(pet.fragmentCard(ownedFragmentCount, action));
            return `\`x${count}\` **${fragment.name}**`;
          })
          .join(" ");

        msg.channel.send(`You got ${fragment}!`);
        cards.forEach(x => msg.channel.send(x));
      })

    } else if (item instanceof Fragment) {

      button.addButton("🟢", "use the item", async () => {

        const pet = item.pet;
        const ownedFragmentCount = inv.getItemCount(item.id);
        let ownedPet = player.pets.find(x => x.id === pet.id);

        // if own the pet but does not have enough fragment to upgrade
        if (ownedPet && ownedFragmentCount < ownedPet.upgradeCost) {
          return msg.channel.send(oneLine`Insufficient fragments to upgrade
            ${ownedPet.name} \`${ownedFragmentCount}/${ownedPet.upgradeCost}\``)

          // if player does not own the pet but has less fragments than required
          // fragment in order to obtain the pet
        } else if (ownedFragmentCount < Fragment.minFragments) {
          return msg.channel.send(oneLine`Insufficient fragments to summon
            ${pet.name} \`${ownedFragmentCount}/${Fragment.minFragments}\``)
        }

        const result = await item.use(player);
        await player.sync();
          
        ownedPet = player.pets.find(x => x.id === pet.id)!;
        const fragmentCount = player.inventory.getItemCount(item.id);

        if (result === "obtain") {
          const summonAnimation = await msg.channel.send(item.summonAnimation());
          await sleep(8000);
          await summonAnimation.delete();
          msg.channel.send(`${player.name} has obtained **${pet.name}**!`);
          msg.channel.send(ownedPet.card(fragmentCount));

        } else if (result === "upgrade") {
          const ownedPet = player.pets.find(x => x.id === pet.id)!;
          const upgradeAnimation = await msg.channel.send(item.upgradeAnimation())
          await sleep(8000);
          await upgradeAnimation.delete();
          msg.channel.send(`${pet.name} is now **${ownedPet.star}** ${STAR}!`);
          msg.channel.send(ownedPet.card(fragmentCount));

        }
      })

    }

    button.addButton("↩️", "return to inventory list", () => {
      inventory(msg, []);
    })
    button.addCloseButton();
    button.run();

    return;
  }

  const itemsList = acc.reduce((acc, v, i) => {
    return acc + `\n${i + 1}. \`x${v.count} ${v.name}\``;
  }, "").trim();

  const embed = new MessageEmbed()
    .setColor(GOLD)
    .addField("Inventory", itemsList || "None")
    .addField("\u200b", oneLine`use command \`${PREFIX}inventory <number>\` 
      to inspect item in the inventory.`);

  msg.channel.send(embed);
}
