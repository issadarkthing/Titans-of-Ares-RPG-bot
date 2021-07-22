import { Message, MessageEmbed } from "discord.js";
import { Chest } from "../internals/Chest";
import { Fragment, FragmentID } from "../internals/Fragment";
import { Player } from "../internals/Player";
import { aggregateBy, BLUE_BUTTON, BROWN, GOLD, NUMBER_BUTTONS, RETURN_BUTTON, STAR } from "../internals/utils";
import { sleep } from "../internals/utils";
import { oneLine } from "common-tags";
import { ButtonHandler } from "../internals/ButtonHandler";
import { PREFIX } from "..";
import { Pet, PetID } from "../internals/Pet";
import { addInventory, removeInventory } from "../db/inventory";
import { Gear } from "../internals/Gear";
import { equipGear } from "../db/gear";

export async function inventory(msg: Message, args: string[]) {

  const player = await Player.getPlayer(msg.member!);
  const inv = player.inventory;
  const acc = inv.all.aggregate();
  const [index] = args;

  if (index) {

    const i = parseInt(index) - 1;
    if (Number.isNaN(i))
      return msg.channel.send("Please give valid index");

    const accItem = acc[i];
    if (!accItem)
      return msg.channel.send(`No item found at index ${i}`);

    const item = inv.all.get(accItem.value.id)!;

    if (item instanceof Fragment) {
      const pet = player.pets.get(item.pet.id);
      if (pet) {
        item.pet = pet;
      }
    }

    const button = new ButtonHandler(msg, item.show(accItem.count), player.id);

    if (item instanceof Chest) {
      button.addButton("🔵", "use the item", async () => {

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
            const ownedPet = player.pets.get(fragment.pet.id);
            const pet = ownedPet || fragment.pet;
            const ownedFragmentCount = player.inventory.all.count(id);
            cards.push(pet.fragmentCard(ownedFragmentCount));
            return `\`x${count}\` **${fragment.name}**`;
          })
          .join(" ");

        msg.channel.send(`You got ${fragment}!`);
        cards.forEach(x => msg.channel.send(x));
      })

    } else if (item instanceof Fragment) {

      button.addButton("🔵", "use the item", async () => {

        const pet = item.pet;
        const ownedFragmentCount = inv.all.count(item.id);
        let ownedPet = player.pets.get(pet.id);

        // if own the pet but does not have enough fragment to upgrade
        if (ownedPet && ownedFragmentCount < ownedPet.upgradeCost) {
          return msg.channel.send(oneLine`Insufficient fragments to upgrade
            ${ownedPet.name} \`${ownedFragmentCount}/${ownedPet.upgradeCost}\``)

          // if player does not own the pet but has less fragments than required
          // fragment in order to obtain the pet
        } else if (ownedFragmentCount < Fragment.minFragments) {
          return msg.channel.send(oneLine`Insufficient fragments to summon
            ${pet.name} \`${ownedFragmentCount}/${Fragment.minFragments}\``)

        } else if (ownedPet && ownedPet.star >= 5) {
          return msg.channel.send("Your pet is already at max star");
        }

        const result = await item.use(player);
        await player.sync();
          
        ownedPet = player.pets.get(pet.id)!;
        const fragmentCount = player.inventory.all.count(item.id);

        if (result === "obtain") {
          const summonAnimation = await msg.channel.send(item.summonAnimation());
          await sleep(8000);
          await summonAnimation.delete();
          msg.channel.send(`${player.name} has obtained **${pet.name}**!`);
          msg.channel.send(ownedPet.card(fragmentCount, true));

        } else if (result === "upgrade") {
          const ownedPet = player.pets.get(pet.id)!;
          const upgradeAnimation = await msg.channel.send(item.upgradeAnimation())
          await sleep(8000);
          await upgradeAnimation.delete();
          msg.channel.send(`${pet.name} is now **${ownedPet.star}** ${STAR}!`);
          msg.channel.send(ownedPet.card(fragmentCount, true));

        }
      })

      button.addButton("⚪", "convert this fragment to other fragment of choice", () => {

          const ownedFragmentCount = inv.all.count(item.id);
          if (ownedFragmentCount < 2) {
            return msg.channel.send(
              "Two fragments needed to convert to another pet fragment"
            )
          }

          const embed = new MessageEmbed()
            .setColor(BROWN)
            .addField("Select which pet fragments you want to convert to", 
              oneLine`This will replace \`x2\` or \`x3\` ${item.pet.name}'s fragment with
              the selected fragment depending on the ratio`)

          const choiceButton = new ButtonHandler(msg, embed, player.id);

          Pet.all.forEach((pet, i) => {

            const isDragon = pet.id === PetID.Dragon;
            const button = NUMBER_BUTTONS[i + 1];
            const label = isDragon ? 
              `${pet.fragment.name} - Ratio 3:1` : 
              `${pet.fragment.name} - Ratio 2:1`;
            choiceButton.addButton(button, label, async () => {

              if (isDragon && ownedFragmentCount < 3) {
                return msg.channel.send("Dragon requires 3 fragments");
              }

              await removeInventory(player.id, item.id);
              await removeInventory(player.id, item.id);
              
              if (isDragon) {
                await removeInventory(player.id, item.id);
              }

              const convertAnimation = item.convertAnimation(pet.fragment.name);
              const animation = await msg.channel.send(convertAnimation);

              await sleep(8000);
              await animation.delete();

              await addInventory(player.id, pet.fragment.id);
              msg.channel.send(oneLine`
                Successfully converted \`x${isDragon ? 3 : 2}\` **${item.name}**
                into \`x1\` **${pet.fragment.name}**!`)
            })

          })

          choiceButton.addCloseButton();
          choiceButton.run();
      })

    } else if (item instanceof Gear) {

      button.addButton(BLUE_BUTTON, "equip gear", () => {
        equipGear(player.id, item.id);
        msg.channel.send(
          `Successfully equipped **${item.name}**!`
        )
      })

    }

    button.addButton(RETURN_BUTTON, "return to inventory list", () => {
      inventory(msg, []);
    })
    button.addCloseButton();
    button.run();

    return;
  }

  const itemsList = acc.reduce((acc, v, i) => {
    return acc + `\n${i + 1}. \`x${v.count} ${v.value.name}\``;
  }, "").trim();

  const embed = new MessageEmbed()
    .setColor(GOLD)
    .addField("Inventory", itemsList || "None")
    .addField("\u200b", oneLine`Use command \`${PREFIX}inventory <number>\` 
      to inspect item in the inventory.`);

  msg.channel.send(embed);
}
