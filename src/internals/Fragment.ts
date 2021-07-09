import { removeInventory } from "../db/inventory";
import { addPet, upgradePet } from "../db/pet";
import { Item } from "./Item";
import { Pet, PetID } from "./Pet";
import { Player } from "./Player";

export type FragmentID = `fragment_${PetID}`;

export class Fragment extends Item {

  readonly pet: Pet;

  constructor(public id: FragmentID) {
    super();
    const petID = this.id.split("_").slice(1).join("_");
    this.pet = Pet.fromPetID(petID as PetID);
  }

  static fromPetID(petID: PetID) {
    return new Fragment(`fragment_${petID}` as FragmentID);
  }

  /** mininum fragments in order to obtain the pet */
  static get minFragments() {
    return 8;
  }

  get name() {
    return `${this.pet.name}'s fragment`;
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
