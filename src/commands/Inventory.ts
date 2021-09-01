import { oneLine, stripIndents } from "common-tags";
import { Message, MessageEmbed } from "discord.js";
import { equipGear, unequipGear } from "../db/gear";
import { addInventory, removeInventory } from "../db/inventory";
import { ButtonHandler } from "../internals/ButtonHandler";
import { Chest } from "../internals/Chest";
import Command from "../internals/Command";
import { Fragment, FragmentID } from "../internals/Fragment";
import { Gear } from "../internals/Gear";
import { Inventory } from "../internals/Inventory";
import { Stone } from "../internals/Mining";
import { upgrade } from "../internals/multipleUpgrade";
import { Pet, PetID } from "../internals/Pet";
import { Player } from "../internals/Player";
import {
  aggregateBy,
  BLACK_BUTTON,
  BLUE_BUTTON,
  BROWN,
  GOLD,
  NUMBER_BUTTONS,
  RED_BUTTON,
  RETURN_BUTTON,
  sleep,
  STAR,
  WHITE_BUTTON,
} from "../internals/utils";
import { client } from "../main";

export default class extends Command {
  name = "inventory";
  aliases = ["inv"];
  private inventory!: Inventory;

  private handleChest(
    button: ButtonHandler,
    item: Chest,
    player: Player,
    msg: Message
  ) {
    button.addButton(BLUE_BUTTON, "use the item", async () => {
      const result = await item.use(player);
      await player.sync();

      const chestOpening = await msg.channel.send(item.openChestAnimation());
      await sleep(6000);
      await chestOpening.delete();

      const cards: MessageEmbed[] = [];
      const aggregated = aggregateBy(result, (x) => x.id);
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
      cards.forEach((x) => msg.channel.send(x));
    });
  }

  private handleFragment(
    button: ButtonHandler,
    item: Fragment,
    player: Player,
    msg: Message
  ) {
    const ownedPet = player.pets.get(item.pet.id);
    if (!ownedPet || ownedPet.star < 5) {
      button.addButton(BLUE_BUTTON, "use the item", async () => {
        const pet = item.pet;
        const ownedFragmentCount = this.inventory.all.count(item.id);
        let ownedPet = player.pets.get(pet.id);

        // if own the pet but does not have enough fragment to upgrade
        if (ownedPet && ownedFragmentCount < ownedPet.upgradeCost) {
          return msg.channel.send(oneLine`Insufficient fragments to upgrade
                                  ${ownedPet.name} \`${ownedFragmentCount}/${ownedPet.upgradeCost}\``);

          // if player does not own the pet but has less fragments than required
          // fragment in order to obtain the pet
        } else if (ownedFragmentCount < Fragment.minFragments) {
          return msg.channel.send(oneLine`Insufficient fragments to summon
                                  ${pet.name} \`${ownedFragmentCount}/${Fragment.minFragments}\``);
        } else if (ownedPet && ownedPet.star >= 5) {
          return msg.channel.send("Your pet is already at max star");
        }

        const result = await item.use(player);
        await player.sync();

        ownedPet = player.pets.get(pet.id)!;
        const fragmentCount = player.inventory.all.count(item.id);

        if (result === "obtain") {
          const summonAnimation = await msg.channel.send(
            item.summonAnimation()
          );
          await sleep(8000);
          await summonAnimation.delete();
          msg.channel.send(`${player.name} has obtained **${pet.name}**!`);
          msg.channel.send(ownedPet.card(fragmentCount, true));
        } else if (result === "upgrade") {
          const ownedPet = player.pets.get(pet.id)!;
          const upgradeAnimation = await msg.channel.send(
            item.upgradeAnimation()
          );
          await sleep(8000);
          await upgradeAnimation.delete();
          msg.channel.send(`${pet.name} is now **${ownedPet.star}** ${STAR}!`);
          msg.channel.send(ownedPet.card(fragmentCount, true));
        }
      });
    }

    button.addButton(
      WHITE_BUTTON,
      "convert this fragment to other fragment of choice",
      () => {
        const ownedFragmentCount = this.inventory.all.count(item.id);
        if (ownedFragmentCount < 2) {
          return msg.channel.send(
            "Two fragments needed to convert to another pet fragment"
          );
        }

        const embed = new MessageEmbed().setColor(BROWN).addField(
          "Select which pet fragments you want to convert to",
          oneLine`This will replace \`x2\` or \`x3\` ${item.pet.name}'s fragment with
          the selected fragment depending on the ratio`
        );

        const choiceButton = new ButtonHandler(msg, embed, player.id);

        Pet.all.forEach((pet, i) => {
          const isDragon = pet.id === PetID.Dragon;
          const button = NUMBER_BUTTONS[i + 1];
          const label = isDragon
            ? `${pet.fragment.name} - Ratio 3:1`
            : `${pet.fragment.name} - Ratio 2:1`;
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
                               Successfully converted \`x${
                                 isDragon ? 3 : 2
                               }\` **${item.name}**
                               into \`x1\` **${pet.fragment.name}**!`);
          });
        });

        choiceButton.addCloseButton();
        choiceButton.run();
      }
    );
  }

  private handleGear(button: ButtonHandler, item: Gear, player: Player, msg: Message) {

    button.addButton(BLUE_BUTTON, "equip gear", async () => {
      const currentPiece = player.equippedGears.find(
        (x) => x.constructor.name === item.constructor.name
      );

      // unequip gear if piece is the same for example Arena Armor and
      // Apprentice Armor
      if (currentPiece) {
        await unequipGear(player.id, currentPiece.id);
      }

      await equipGear(player.id, item.id);
      msg.channel.send(`Successfully equipped **${item.name}**!`);
    });

    if (item.level < 10) {
      button.addButton(
        WHITE_BUTTON,
        "upgrade item using 1 scroll",
        upgrade(item, msg, player, 1)
      );

      button.addButton(
        RED_BUTTON,
        "upgrade item using 10 scroll",
        upgrade(item, msg, player, 10)
      );

      button.addButton(
        BLACK_BUTTON,
        "upgrade item using 50 scrolls",
        upgrade(item, msg, player, 50)
      );
    }
  }

  async exec(msg: Message, args: string[]) {
    const player = await Player.getPlayer(msg.member!);
    const inv = player.inventory;
    const itemsList = [
      ...inv.chests.aggregate(),
      ...inv.fragments.aggregate(),
      ...inv.gears.aggregate(),
      ...inv.scrolls.aggregate(),
      ...inv.stones.aggregate(),
    ];
    const [index] = args;

    if (index) {
      const i = parseInt(index) - 1;
      if (Number.isNaN(i)) return msg.channel.send("Please give valid index");

      const accItem = itemsList[i];
      if (!accItem) return msg.channel.send(`No item found at index ${index}`);

      const item = inv.all.get(accItem.value.id)!;
      const itemCount = accItem.count;

      if (item instanceof Fragment) {
        const pet = player.pets.get(item.pet.id);
        if (pet) {
          item.pet = pet;
        }
      }

      let button = new ButtonHandler(msg, item.show(itemCount), player.id);

      // attach handlers to every types of item
      if (item instanceof Chest) {
        this.handleChest(button, item, player, msg);
      } else if (item instanceof Fragment) {
        this.handleFragment(button, item, player, msg);
      } else if (item instanceof Gear) {
        const scrollCount = player.inventory.all.count(item.scroll.id);
        button = new ButtonHandler(msg, item.inspect(scrollCount), player.id);

        this.handleGear(button, item, player, msg);
      }

      button.addButton(RETURN_BUTTON, "return to inventory list", () => {
        this.exec(msg, []);
      });
      button.addCloseButton();
      await button.run();

      return;
    }

    const chestList = [];
    const fragmentList = [];
    const gearList = [];
    const stonesList = [];
    const othersList = [];

    let i = 1;
    for (const { value: item, count } of itemsList) {
      let line = `${i}. \`x${count} ${item.name}\``;
      switch (true) {
        case item instanceof Chest:
          chestList.push(line);
          break;
        case item instanceof Fragment:
          fragmentList.push(line);
          break;
        case item instanceof Gear:
          line = `${i}. \`x${count} ${item.name} Lvl ${(item as Gear).level}\``;
          gearList.push(line);
          break;
        case item instanceof Stone:
          stonesList.push(line);
          break;
        default:
          othersList.push(line);
      }
      i++;
    }

    const list = stripIndents`
    **Treasure Chests**
    ${chestList.join("\n") || "none"}

    **Pet Fragments**
    ${fragmentList.join("\n") || "none"}

    **Gear**
    ${gearList.join("\n") || "none"}

    **Stones**
    ${stonesList.join("\n") || "none"}

    **Other Materials**
    ${othersList.join("\n") || "none"}

    **Coins**
    \`${player.coins}\` Coins
    \`${player.arenaCoins}\` Arena Coins
    `;

    const embed = new MessageEmbed()
      .setColor(GOLD)
      .addField("Inventory", list)
      .addField(
        "\u200b",
        stripIndents`
        Use command \`${client.prefix}inventory <number>\` to inspect item in the inventory.
        Use command \`${client.prefix}gear\` to see your current equipped gear.
        `
      );

    msg.channel.send(embed);
  }
}
