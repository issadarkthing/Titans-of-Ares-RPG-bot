import { MedalType } from "./Medal";
import { Item } from "./Item";
import { capitalize, CDN_LINK, GREEN, random } from "./utils";
import { Player } from "./Player";
import { PetID } from "./Pet";
import { Fragment } from "./Fragment";
import { removeInventory } from "../db/inventory";
import { MessageEmbed } from "discord.js";

export type Level = "bronze" | "silver" | "gold";
export type ChestID = `chest_${Level}`;

const openingChestGif = CDN_LINK +
  "574852830125359126/862679388146368582/chest-open.gif";

export class Chest extends Item {

  private level: Level;
  id: ChestID;
  constructor(id: ChestID) {
    super();
    this.level = id.split("_")[1] as Level;
    this.id = id;
  }

  get name() {
    return `${capitalize(this.level)} Treasure Chest`
  }

  static fromMedal(medal: MedalType) {
    switch (medal) {
      case "GoldMedal":
        return new Chest("chest_gold");
      case "SilverMedal":
        return new Chest("chest_silver");
      case "BronzeMedal":
        return new Chest("chest_bronze");
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

  private getFragmentCount() {
    switch (this.level) {
      case "bronze":
        return random().pick([1, 2]);
      case "silver":
        return random().pick([2, 3]);
      case "gold":
        return 3;
    }
  }

  private random() {
    return random().pick([
      PetID.Wisp,
      PetID.Golem,
      PetID.Gryphon,
      PetID.Minotaur,
      PetID.Manticore,
    ]);
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
