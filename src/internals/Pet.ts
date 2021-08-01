import { oneLine, stripIndents } from "common-tags";
import { MessageEmbed } from "discord.js";
import { Fragment } from "./Fragment";
import { BROWN, CDN_LINK, GOLD, numberFormat, random, roundTo, STAR } from "./utils";
import { Pet as PetDB } from "../db/pet"
import { Player } from "./Player";
import { DateTime } from "luxon";
import { List } from "./List";

export enum PetID {
  Wisp      = "pet_wisp",
  Golem     = "pet_golem",
  Gryphon   = "pet_gryphon",
  Minotaur  = "pet_minotaur",
  Manticore = "pet_manticore",
  Dragon    = "pet_dragon",
}

export abstract class Pet {
  abstract id: PetID;
  abstract name: string;
  abstract description: string;
  abstract imageUrl: string;
  abstract fragmentImageUrl: string;
  /** image used when pet is intercepting during battle */
  abstract petInterceptionUrl: string;
  abstract get passiveStatDescription(): string;
  /** returns true if pet is spawn in that particular round */
  abstract isSpawn(round: number): boolean;
  /** apply passive attribute */
  abstract use(player: Player): string;
  /** passive multiplier */
  abstract get multiplier(): number;
  /** represents pet level.
   * -1 represents this pet has not been obtained yet
   * */
  star = -1;
  active = false;
  createdAt = DateTime.now();

  static fromPetID(id: PetID) {
    switch (id) {
      case PetID.Wisp: return new Wisp();
      case PetID.Golem: return new Golem();
      case PetID.Gryphon: return new Gryphon();
      case PetID.Minotaur: return new Minotaur();
      case PetID.Manticore: return new Manticore();
      case PetID.Dragon: return new Dragon();
    }
  }

  static get all() {
    return List.from([
      new Wisp(),
      new Golem(),
      new Gryphon(),
      new Minotaur(),
      new Manticore(),
      new Dragon(),
    ]);
  }

  static fromDB(petDB: PetDB) {
    const pet = Pet.fromPetID(petDB.PetID);
    pet.star = petDB.Star;
    pet.active = petDB.Active === 1;
    pet.createdAt = DateTime.fromSQL(petDB.Created, { zone: "gmt" });
    return pet;
  }

  /** gets random pet based off weightage 
   *  dragon - 5% 
   *  others - 19%
   * */
  static random() {
    return Pet.all.weightedRandom(x => x.id === PetID.Dragon ? 5 : 19);
  } 

  get fragment() {
    return Fragment.fromPetID(this.id);
  }

  fragmentCard(fragmentCount: number) {

    const action = this.star === -1 ? "summon" : "upgrade";
    const requiredFragment = action === "summon" ? 
      Fragment.minFragments : this.upgradeCost;

    const footerText = oneLine`You currently have 
    ${fragmentCount}/${requiredFragment} fragments to ${action} this pet`
    
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle(`${this.name}'s Fragment`)
      .setThumbnail(this.fragmentImageUrl)
      .addField("Active Skill", this.description)
      .addField("\u200b", "\u200b")
      .setFooter(footerText);

    return embed;
  }

  card(fragmentCount: number, showPossession = false) {

    const action = this.star === -1 ? "summon" : "upgrade";
    const fragmentCostText = this.star === 5 ? 
      "max" : `\`${fragmentCount}/${this.upgradeCost}\``;

    const embed = new MessageEmbed()
      .setColor(BROWN)
      .setTitle(this.name)
      .setThumbnail(this.imageUrl)
      .addField("Active Skill", this.description)
      .addField(`Fragments to ${action}`, fragmentCostText, true)


    if (this.star !== -1) {
      embed.addField("Level", `\`${this.star}\` ${STAR}`, true)

      if (showPossession) {
        embed.addField("Summoned", this.star !== -1 ? "yes" : "no", true)
      }

      embed.addField("Passive Stat", this.passiveStatDescription, true)
      embed.addField("Status", this.active ? "active" : "inactive", true)
      embed.addField("Summoned On", 
        this.createdAt.toLocaleString(DateTime.DATE_MED), true)
    }

    return embed;
  }

  interceptCard(message: string) {
    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle("Pet Interception")
      .setDescription(message)
      .setImage(this.petInterceptionUrl)

    return embed;
  }

  /** the cost of upgrading pet (+1) in form of fragments */
  get upgradeCost() {
    switch (this.star) {
      case 0: return 6;
      case 1: return 6;
      case 2: return 8;
      case 3: return 8;
      case 4: return 10;
      default: return 5;
    }
  }
}

export class Wisp extends Pet {
  id = PetID.Wisp;
  name = "Will-O'-Wisp";
  description = oneLine`Heals 40% of your max HP in round 2-5 randomly. Can only
  happen once each battle`;
  imageUrl = CDN_LINK + "574852830125359126/862540067432431617/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862656523531321344/wisp.png";
  petInterceptionUrl = CDN_LINK + "852530378916888626/863778345182429214/Blue-Flame-Illustration.gif";
  private hasSpawn = false;
  spawnAt = random().integer(2, 5);

  get passiveStatDescription() {
    return `\`+${this.multiplier * 100}%\` HP from base stats`;
  }

  get multiplier() {
    return this.star * 0.1;
  }

  isSpawn(round: number) {
    if (this.hasSpawn) return false;

    if (this.spawnAt === round) {
      this.hasSpawn = true;
      return true;
    }

    return false;
  }

  use(player: Player) {
    const amount = player.hp * this.multiplier;
    player.hp += amount;
    return `\`+${Math.round(amount)}\` HP`;
  }
}

export class Golem extends Pet {
  id = PetID.Golem;
  name = "Golem";
  description = oneLine`Critical hits get blocked and do normal damage to you`;
  imageUrl = CDN_LINK + "574852830125359126/862541338754809886/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862667634313920512/golem.png";
  petInterceptionUrl = CDN_LINK + "852530378916888626/864139662870970388/ezgif-7-4cc290f06da8.gif";

  get passiveStatDescription() {
    return `\`+${this.multiplier * 100}%\` armor from gear`;
  }

  get multiplier() {
    return this.star * 0.1;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSpawn(_round: number) {
    return true;
  }

  use(player: Player) {
    const amount = this.multiplier * player.armor;
    player.armor += amount;
    return `\`+${roundTo(amount, 1)}\` Armor`
  }
}

export class Gryphon extends Pet {
  id = PetID.Gryphon;
  name = "Gryphon";
  description = oneLine`Saves you from 1 attack randomly round 1-5. Can only
  happen once each battle`;
  imageUrl = CDN_LINK + "574852830125359126/862541562022068264/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862655845447630888/gryphon.png"
  petInterceptionUrl = CDN_LINK + "852530378916888626/864399592762114078/GryphonCompressed.gif";
  private hasSpawn = false;
  spawnAt = random().integer(2, 5);

  get passiveStatDescription() {
    return `\`+${this.multiplier * 100}%\` speed from base stats`;
  }

  get multiplier() {
    return this.star * 0.2;
  }

  isSpawn(round: number) {

    if (this.hasSpawn) return false;
    
    if (this.spawnAt === round) {
      this.hasSpawn = true;
      return true;
    }

    return false;
  }

  use(player: Player) {
    const amount = player.baseStats.speed * this.multiplier;
    player.speed += amount;
    return `\`+${Math.round(amount)}\` Speed`;
  }
}

export class Minotaur extends Pet {
  id = PetID.Minotaur;
  name = "Minotaur";
  description = oneLine`Has a 20% chance every round to attack the opponent for
  50% of strength`;
  imageUrl = CDN_LINK + "574852830125359126/862541876804059146/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862669333775777832/minotaur.png";
  petInterceptionUrl = CDN_LINK + "852530378916888626/864399618660892682/Minotaurcompressed.gif";

  get passiveStatDescription() {
    return `\`+${this.multiplier * 100}%\` strength from gear stats`;
  }

  get multiplier() {
    return this.star * 0.1;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSpawn(_round: number) {
    return random().bool(0.2);
  }

  use(player: Player) {
    const strength = player.gearStatsValue.get("Strength") || 0;
    const amount = strength * this.multiplier
    player.strength += amount;
    return `\`+${Math.round(amount)}\` Strength`;
  }
}

export class Manticore extends Pet {
  id = PetID.Manticore;
  name = "Manticore";
  description = "Your first attack will 100% crit";
  imageUrl = CDN_LINK + "574852830125359126/862542055674216448/unknown.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/862671084717604874/manticore.png";
  petInterceptionUrl = CDN_LINK + "852530378916888626/864399340067880960/ManticoreCompressed.gif";

  get passiveStatDescription() {
    return `\`+${this.multiplier}\` Crit Damage`;
  }

  get multiplier() {
    return this.star * 0.2;
  }

  isSpawn(round: number) {
    return round === 1;
  }

  use(player: Player) {
    const amount = player.critDamage * this.multiplier;
    player.critDamage += amount;
    return `\`+${numberFormat(amount)}\` Crit Damage`
  }
}

export class Dragon extends Pet {
  id = PetID.Dragon;
  name = "Dragon";
  description = oneLine`Has a 20% chance for a flame breath every round, dealing
  \`50/100/200/500/1000/2000\` damage regardless of armor and burns the enemy for
  \`2%/4%/6%/10%/20%/40%\` of their max HP.  Can only happen once each battle`;
  imageUrl = CDN_LINK + "574852830125359126/863997311532007475/8edc1273be7f8b1c4be3d72af3358e9b.png";
  fragmentImageUrl = CDN_LINK + "574852830125359126/863999076475469834/dragon.png";
  petInterceptionUrl = CDN_LINK + "574852830125359126/864027308796805120/dragon.gif"
  private hasSpawn = false;

  get passiveStatDescription() {
    return `\`+${this.multiplier * 100}%\` all stats\n(Strength, HP, Armor, Speed)`;
  }

  get multiplier() {
    switch (this.star) {
      case 1: return 0.01;
      case 2: return 0.03;
      case 3: return 0.1;
      case 4: return 0.3;
      case 5: return 0.5;
      default: return 0;
    }
  }

  /** damage done during battle */ 
  get damage() {
    switch (this.star) {
      case 1: return 100;
      case 2: return 200;
      case 3: return 500;
      case 4: return 1000;
      case 5: return 2000;
      default: return 50;
    }
  }

  /** burn damage percentage */ 
  get burn() {
    switch (this.star) {
      case 1: return 0.04;
      case 2: return 0.06;
      case 3: return 0.1;
      case 4: return 0.2;
      case 5: return 0.4;
      default: return 0.02;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isSpawn(_round: number) {
    if (this.hasSpawn) return false;

    const spawn = random().bool(0.2);
    if (spawn) {
      this.hasSpawn = spawn;
      return spawn;
    }

    return false
  }

  use(player: Player) {
    const strengthAmount = player.strength * this.multiplier;
    const hpAmount = player.hp * this.multiplier;
    const armorAmount = player.armor * this.multiplier;
    const speedAmount = player.speed * this.multiplier;
    player.strength += strengthAmount;
    player.hp += hpAmount;
    player.armor += armorAmount;
    player.speed += speedAmount;

    return stripIndents`
    \`+${Math.round(strengthAmount)}\` Strength
    \`+${Math.round(hpAmount)}\` HP
    \`+${numberFormat(armorAmount)}\` Armor
    \`+${Math.round(speedAmount)}\` Speed
    `
  }
}
