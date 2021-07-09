import { oneLine } from "common-tags";
import { MessageEmbed } from "discord.js";
import { Fragment } from "./Fragment";
import { BROWN, CDN_LINK, GOLD, STAR } from "./utils";
import { Pet as PetDB } from "../db/pet"

export enum PetID {
  Wisp      = "pet_wisp",
  Golem     = "pet_golem",
  Gryphon   = "pet_gryphon",
  Minotaur  = "pet_minotaur",
  Manticore = "pet_manticore",
}

export abstract class Pet {
  abstract id: PetID;
  abstract name: string;
  abstract description: string;
  abstract imageUrl: string;
  abstract fragmentImageUrl: string;
  star = 0; // min: 0 max: 5
  active = false;

  static fromPetID(id: PetID) {
    switch (id) {
      case PetID.Wisp:
        return new Wisp();
      case PetID.Golem:
        return new Golem();
      case PetID.Gryphon:
        return new Gryphon();
      case PetID.Minotaur:
        return new Minotaur();
      case PetID.Manticore:
        return new Manticore();
    }
  }

  static fromDB(petDB: PetDB) {
    const pet = Pet.fromPetID(petDB.PetID);
    pet.star = petDB.Star;
    pet.active = petDB.Active === 1;
    return pet;
  }

  fragmentCard(fragmentCount: number, action: "summon" | "upgrade") {
    const requiredFragment = action === "summon" ? 
      Fragment.minFragments : this.upgradeCost;

    const footerText = oneLine`You currently have 
    ${fragmentCount}/${requiredFragment} fragments to ${action} this pet`
    
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle(`${this.name}'s Fragment`)
      .setDescription(this.description)
      .setThumbnail(this.fragmentImageUrl)
      .setFooter(footerText);

    return embed;
  }

  get card() {

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setDescription(this.description)
      .setThumbnail(this.imageUrl)
      .addField("Level", `\`${this.star}\` ${STAR}`)

    return embed;
  }

  /** the cost of upgrading pet (+1) in form of fragments */
  get upgradeCost() {
    switch (this.star) {
      case 0:
        return 10;
      case 1:
        return 15;
      case 2:
        return 20;
      case 3:
        return 30;
      case 4:
        return 50;
      default:
        return 10;
    }
  }
}

export class Wisp extends Pet {
  id = PetID.Wisp;
  name = "Will-O'-Wisp";
  description = oneLine`Heals 40% of your HP in round 2-5 randomly. Can only
  happen once each battle`;
  imageUrl = CDN_LINK + "574852830125359126/862540067432431617/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862656523531321344/wisp.png";
}

export class Golem extends Pet {
  id = PetID.Golem;
  name = "Golem";
  description = oneLine`Critical hits get blocked and do normal damage to you`;
  imageUrl = CDN_LINK + "574852830125359126/862541338754809886/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862667634313920512/golem.png";
}

export class Gryphon extends Pet {
  id = PetID.Gryphon;
  name = "Gryphon";
  description = oneLine`Saves you from 1 attack randomly round 1-5. Can only
  happen once each battle`;
  imageUrl = CDN_LINK + "574852830125359126/862541562022068264/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862655845447630888/gryphon.png"
}

export class Minotaur extends Pet {
  id = PetID.Minotaur;
  name = "Minotaur";
  description = oneLine`Has a 20% chance every round to attack the opponent for
  50% of strength`;
  imageUrl = CDN_LINK + "574852830125359126/862541876804059146/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862669333775777832/minotaur.png"
}

export class Manticore extends Pet {
  id = PetID.Manticore;
  name = "Manticore";
  description = "Your first attack will 100% crit";
  imageUrl = CDN_LINK + "574852830125359126/862542055674216448/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862671084717604874/manticore.png";
}
