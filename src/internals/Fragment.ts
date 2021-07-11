import { oneLine } from "common-tags";
import { MessageEmbed } from "discord.js";
import { removeInventory } from "../db/inventory";
import { addPet, upgradePet } from "../db/pet";
import { Item } from "./Item";
import { Pet, PetID } from "./Pet";
import { Player } from "./Player";
import { BROWN, CDN_LINK, GOLD } from "./utils";

export type FragmentID = `fragment_${PetID}`;

export class Fragment extends Item {

  pet: Pet;
  private summonGif = 
    CDN_LINK + "852546444086214676/863007776983613460/giphy_1.gif";
  private upgradeGif =
    CDN_LINK + "852546444086214676/863011578663272448/giphy_5.gif";

  constructor(public id: FragmentID) {
    super();
    const petID = this.id.split("_").slice(1).join("_");
    this.pet = Pet.fromPetID(petID as PetID);
  }

  static fromPetID(petID: PetID) {
    return new Fragment(`fragment_${petID}` as FragmentID);
  }

  static fromPet(pet: Pet) {
    const fragment = Fragment.fromPetID(pet.id);
    fragment.pet = pet;
    return fragment;
  }

  /** mininum fragments in order to obtain the pet */
  static get minFragments() {
    return 8;
  }

  get name() {
    return `${this.pet.name}'s fragment`;
  }

  get description() {
    return oneLine`This is a fragment for the ${this.pet.name}. If you have
    enough fragments you can summon this pet or upgrade it.`;
  }

  summonAnimation() {
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setImage(this.summonGif)
      .setTitle(`Summoning ${this.pet.name}`)

    return embed;
  }

  upgradeAnimation() {
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setImage(this.upgradeGif)
      .setTitle(`Upgrading ${this.pet.name}`)

    return embed;
  }

  show(count: number) {

    const action = this.pet.star === -1 ? "summon" : "upgrade";
    const required = this.pet.upgradeCost;

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setThumbnail(this.pet.fragmentImageUrl)
      .setDescription(this.description)
      .addField(`Fragments to ${action}`, `\`${count}/${required}\``)

    return embed;
  }

  /** Merges fragments and remove the fragments from player's inventory. Adds
   * obtained pet to user's pet collection. If pet already exists, it will
   * upgrade the pet.
   * */
  async use(player: Player) {
    
    const playerOwnedPet = player.pets.find(x => x.id === this.pet.id);
    const fragmentCost = playerOwnedPet?.upgradeCost || Fragment.minFragments;

    for (let i = 0; i < fragmentCost; i++)
      await removeInventory(player.id, this.id);

    if (playerOwnedPet) {
      await upgradePet(player.id, playerOwnedPet.id);
      return "upgrade" as const;
    } 
      
    await addPet(player.id, this.pet.id);
    return "obtain" as const;
  }
}
