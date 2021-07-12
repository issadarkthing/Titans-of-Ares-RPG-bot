import { MedalType } from "./Medal";
import { Item } from "./Item";
import { BROWN, capitalize, CDN_LINK, GREEN, random } from "./utils";
import { Player } from "./Player";
import { Pet } from "./Pet";
import { Fragment } from "./Fragment";
import { removeInventory } from "../db/inventory";
import { MessageEmbed } from "discord.js";
import { oneLine } from "common-tags";

export type Level = "bronze" | "silver" | "gold";
export type ChestID = `chest_${Level}`;

const openingChestGif = CDN_LINK + "574852830125359126/862679388146368582/chest-open.gif";

export abstract class Chest extends Item {

  protected abstract level: Level;
  protected abstract getFragmentCount(): number;
  abstract imageUrl: string;

  get id() {
    return `chest_${this.level}`;
  }

  get name() {
    return `${capitalize(this.level)} Treasure Chest`
  }

  get description() {
    return oneLine`This is a ${capitalize(this.level)} Treasure Chest awarded by
    the Monthly Challenge. You can open it for Pet Fragments.`
  }

  static fromChestID(chestID: ChestID) {
    switch (chestID) {
      case "chest_gold":
        return new GoldChest();
      case "chest_silver":
        return new SilverChest();
      case "chest_bronze":
        return new BronzeChest();
    }
  }

  static fromMedal(medal: MedalType) {
    switch (medal) {
      case "GoldMedal":
        return new GoldChest();
      case "SilverMedal":
        return new SilverChest();
      case "BronzeMedal":
        return new BronzeChest();
      default:
        throw Error("invalid medal");
    }
  }

  openChestAnimation() {
    const embed = new MessageEmbed()
      .setColor(GREEN)
      .setImage(openingChestGif)
      .setTitle(`Opening ${this.name}`)

    return embed;
  }

  private random() {
    return random().pick(Pet.all.map(x => x.id));
  }

  show(count: number) {

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setThumbnail(this.imageUrl)
      .setTitle(this.name)
      .setDescription(this.description)
      .addField("Count", `\`x${count}\``)

    return embed;
  }

  /** open up the chest and add the fragments to the player's inventory */
  async use(player: Player) {

    const fragments: Fragment[] = [];
    const fragmentCount = this.getFragmentCount();

    for (let i = 0; i < fragmentCount; i++) {
      const petID = this.random();
      const fragment = Fragment.fromPetID(petID);
      fragments.push(fragment);
      await fragment.save(player);
    }

    await removeInventory(player.id, this.id);

    return fragments;
  }
}

class GoldChest extends Chest {
  level = "gold" as Level;
  imageUrl = CDN_LINK + "768053872400007218/863093260175540234/c8zixtnh-900.jpg";

  protected getFragmentCount() {
    return 3;
  }
}

class SilverChest extends Chest {
  level = "silver" as Level;
  imageUrl = CDN_LINK + "768053872400007218/863093874058592286/magic-chest-3d-model-low-poly-max-obj-mtl-3ds-fbx-tga_1.png";

  protected getFragmentCount() {
    return random().pick([2, 3]);
  }
}

class BronzeChest extends Chest {
  level = "bronze" as Level;
  imageUrl = CDN_LINK + "768053872400007218/863093260418416670/magic-chest-3d-model-low-poly-max-obj-mtl-3ds-fbx-tga.png";

  protected getFragmentCount() {
    return random().pick([1, 2]);
  }
}
