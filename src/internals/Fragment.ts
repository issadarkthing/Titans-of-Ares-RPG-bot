import { Item } from "./Item";
import { Pet, PetID } from "./Pet";

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

  get name() {
    return `${this.pet.name}'s fragment`;
  }

  use() {

  }
}
