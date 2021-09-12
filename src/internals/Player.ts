import { stripIndents } from "common-tags";
import { GuildMember, MessageEmbed } from "discord.js";
import { setArenaCoin, setCoin } from "../db/coin";
import { getGears } from "../db/gear";
import { getAllSocketedGem } from "../db/gem";
import { getInventory, Item } from "../db/inventory";
import { getAllPets } from "../db/pet";
import { createUser, getTotalPoints, getTotalXp, getUser, getUsers } from "../db/player";
import { TimerType } from "../db/timer";
import { client } from "../main";
import { ArenaGear } from "./ArenaGear";
import { Attribute, Attributes } from "./Attributes";
import { Buff, BuffID } from "./Buff";
import { MAX_ENERGY, showTimeLeft } from "./energy";
import { BaseStats, Fighter, IFighter } from "./Fighter";
import { Gear } from "./Gear";
import { Inventory } from "./Inventory";
import { List } from "./List";
import { Gem } from "./Mining";
import { Manticore, Pet } from "./Pet";
import { Profile } from "./Profile";
import { Phase, TeamArena } from "./TeamArena";
import { getLevel, getStats, GOLD, STAR } from "./utils";

export const CRIT_RATE = 0.1;
export const CRIT_DAMAGE = 2;

export interface IPlayer extends IFighter {
  xp: number;
  points: number;
  energy: number;
  coins: number;
  arenaCoins: number;
  userID: string;
  challengerMaxLevel: number;
  member: GuildMember;
  buff: BuffID | null;
  inventory: Item[];
  goldMedal: number;
  silverMedal: number;
  bronzeMedal: number;
  fragmentReward: number;
  pets: List<Pet>;
  equippedGears: List<Gear>;
}

export class Player extends Fighter {

  xp: number;
  points: number;
  coins: number;
  arenaCoins: number;
  energy: number;
  challengerMaxLevel: number;
  buff: Buff | null;
  inventory: Inventory;
  goldMedal: number;
  silverMedal: number;
  bronzeMedal: number;
  pets: List<Pet>;
  baseStats: BaseStats;
  /** Represents upper xp limit the user needed to passed in order to get
   *  rewarded for a fragment. If for example the player's xp decrements, the
   *  fragmentReward will remain the same so that the player cannot get rewarded
   *  for the same limit again. This prevents from user to earn multiple reward.
   * */
  fragmentReward: number;
  equippedGears: List<Gear>;
  readonly id: string;
  readonly member: GuildMember;
  petStat?: string;
  gearStat?: string;
  setBonusActive: boolean;

  constructor(data: IPlayer) {
    super(data);
    this.xp = data.xp;
    this.points = data.points;
    this.coins = data.coins;
    this.arenaCoins = data.arenaCoins;
    this.id = data.userID;
    this.member = data.member;
    this.energy = data.energy;
    this.challengerMaxLevel = data.challengerMaxLevel;
    this.inventory = new Inventory(data.inventory);
    this.goldMedal = data.goldMedal;
    this.silverMedal = data.silverMedal;
    this.bronzeMedal = data.bronzeMedal;
    this.fragmentReward = data.fragmentReward;
    this.pets = data.pets;
    this.equippedGears = data.equippedGears;
    this.buff = data.buff && new Buff(data.buff);
    this.baseStats = {
      hp: this.hp,
      strength: this.strength,
      speed: this.speed,
      armor: this.armor,
      critRate: this.critRate,
      critDamage: this.critDamage,
      armorPenetration: 0,
    }

    this.buff?.use(this);
    this.equippedGears.forEach(gear => gear.use(this));

    const attribs: [Attribute, number][] = [];
    for (const gear of this.equippedGears) {
      attribs.push([gear.attribute, gear.attributeValue]);
    }
    const aggregatedStats = Attributes.aggregate(attribs);
    const stats = Attributes.toStats(aggregatedStats);

    this.gearStat = stats.join("\n");
    this.setBonusActive = this.equippedGears.length === 11;
    this.petStat = this.activePet?.use(this);

    if (this.setBonusActive) {
      const armor = this.equippedGears.random()!;
      const bonus = Gear.getBonus(this.equippedGears);

      if (armor instanceof ArenaGear && bonus) {
        this.armorPenetration += bonus.bonus;
        this.baseStats.armorPenetration += bonus.bonus;
      }
    }
  }

  static async getPlayer(member: GuildMember): Promise<Player> {
    const userId = member.user.id;
    const totalXp = await getTotalXp(userId);
    const totalPoints = await getTotalPoints(userId);
    const level = getLevel(totalXp);
    const stats = getStats(level);
    let inventory = await getInventory(userId);
    const socketGems = await getAllSocketedGem(userId);
    const pets = (await getAllPets(userId)).map(x => Pet.fromDB(x));
    const gears = (await getGears(userId))
      .map(gearDB => {
        const gear = Gear.fromDB(gearDB);
        const socketedGem = socketGems.find(x => x.GearID === gear.id);

        if (socketedGem) {
          // remove socketed gems from inventory
          inventory = inventory.filter(x => x.ID !== socketedGem.InventoryID);
          gear.gem = Gem.fromDB(socketedGem);
        }

        return gear;
      })
    const equippedGears = gears.filter(x => x.equipped);

    let player = await getUser(userId);
    if (!player) {
      player = await createUser(userId);
    }

    return new Player({
      name: member.displayName,
      member,
      level,
      hp: stats.hp,
      strength: stats.strength,
      speed: stats.speed,
      armor: stats.armor,
      critRate: CRIT_RATE,
      critDamage: CRIT_DAMAGE,
      imageUrl: member.user.displayAvatarURL({ format: "jpg" }),
      points: totalPoints,
      xp: totalXp,
      coins: player.Coin,
      arenaCoins: player.ArenaCoin,
      userID: member.user.id,
      energy: player.Energy,
      challengerMaxLevel: player.ChallengerMaxLevel,
      buff: player.Buff,
      inventory,
      goldMedal: player.GoldMedal,
      silverMedal: player.SilverMedal,
      bronzeMedal: player.BronzeMedal,
      pets: List.from(pets),
      equippedGears: List.from(equippedGears),
      fragmentReward: player.FragmentReward,
    })
  }

  get activePet() {
    return this.pets.find(x => x.active);
  }

  get penetration() {
    const equippedGears = this.equippedGears;
    const setBonus = Gear.getBonus(equippedGears);
    const gear = equippedGears.random();

    if (setBonus && gear instanceof ArenaGear) {
      return setBonus.bonus;
    }

    return 0;
  }

  async sync() {
    const data = (await getUser(this.id))!;
    const inventory = await getInventory(this.id);
    const pets = (await getAllPets(this.id)).map(x => Pet.fromDB(x));
    const gears = (await getGears(this.id)).map(x => Gear.fromDB(x));
    const equippedGears = gears.filter(x => x.equipped);

    this.xp = await getTotalXp(this.id);
    this.points = await getTotalPoints(this.id);
    this.level = getLevel(this.xp);
    this.coins = data.Coin;
    this.energy = data.Energy;
    this.challengerMaxLevel = data.ChallengerMaxLevel;
    this.inventory = new Inventory(inventory);
    this.goldMedal = data.GoldMedal;
    this.silverMedal = data.SilverMedal;
    this.bronzeMedal = data.BronzeMedal;
    this.fragmentReward = data.FragmentReward;
    this.buff = data.Buff && new Buff(data.Buff);
    this.pets = List.from(pets);
    this.equippedGears = List.from(equippedGears);
    this.baseStats = {
      hp: this.hp,
      strength: this.strength,
      speed: this.speed,
      armor: this.armor,
      critRate: this.critRate,
      critDamage: this.critDamage,
      armorPenetration: this.baseStats.armorPenetration,
    }


    this.buff?.use(this);
    this.equippedGears.forEach(gear => gear.use(this));
    const attribs = this.equippedGears.map(gear => gear.description);

    this.gearStat = attribs.join("\n");
    this.petStat = this.activePet?.use(this);
  }

  async getRank() {

    const users = await getUsers();
    const cards: { 
      id: string,
      xp: number,
    }[] = [];

    client.logChannel.guild.members.fetch();
    for (const user of users) {
      const xp = await getTotalXp(user.DiscordID);
      const inServer = client.logChannel.guild.members.cache.has(user.DiscordID);

      if (inServer) {
        cards.push({ id: user.DiscordID, xp });
      }
    }

    cards.sort((a, b) => b.xp - a.xp);

    const rank = cards.findIndex(x => x.id === this.id);
    return rank + 1;
  }

  async getProfile() {

    const profile = new Profile({
      name: this.name,
      xp: this.xp,
      level: this.level,
      rank: await this.getRank(),
      imageUrl: this.imageUrl,
      userID: this.id,
      gold: this.goldMedal,
      silver: this.silverMedal,
      bronze: this.bronzeMedal,
    });

    return profile.build();
  }

  async getStats() {
    const energyTimer = await showTimeLeft(TimerType.Energy, this.id);
    const buffTimer = await this.buff?.getTimeLeft(this);
    const xp = Math.round(this.xp);

    const formatOpt = { highlight: true };
    const hp = Attributes.hp.format(this.hp, formatOpt);
    const strength = Attributes.strength.format(this.strength, formatOpt);
    const speed = Attributes.speed.format(this.speed, formatOpt);
    const armor = Attributes.armor.format(this.armor, formatOpt);
    const critRate = Attributes.critRate.format(this.critRate, formatOpt);
    const critDamage = Attributes.critDamage.format(this.critDamage, formatOpt);
    const armorPenetration = Attributes.armorPenetration
      .format(this.armorPenetration, formatOpt);

    const petName = this.activePet ? 
      `${this.activePet.name} \`${this.activePet.star} ${STAR}\`` : "None"
    const petPassiveDesc = this.activePet instanceof Manticore ? "" :
      this.activePet?.passiveStatDescription;
    const equippedGears = this.equippedGears;
    const setBonus = Gear.getBonus(equippedGears);
    const armorBonusSetDesc = setBonus?.description || "";

    const arena = await TeamArena.getCurrentArena();
    const teamArenaMember = arena.candidates
      .find(member => member.player.id === this.id);
    const isBattlePhase = arena.phase === Phase.BATTLE_1;

    const teamArenaEnergyText = teamArenaMember && isBattlePhase ?
      `${teamArenaMember.charge}/${TeamArena.MAX_ENERGY} Team Arena Energy` 
        : "";

    const embed = new MessageEmbed()
      .setColor(GOLD)
      .setTitle(this.name)
      .addField("-----", stripIndents`
        **Stats**
        XP: \`${xp}\` HP: ${hp} Strength: ${strength}
        Speed: ${speed} Armor: ${armor} 
        Crit Rate: ${critRate} Crit Damage: ${critDamage} 
        Armor Penetration: ${armorPenetration}
        
        **Inventory**
        \`${this.inventory.chests.length}\` Treasure Chests
        \`${this.inventory.fragments.length}\` Pet Fragments
        \`${this.inventory.gears.length}\` Gear Pieces
        \`${this.inventory.scrolls.length}\` Scrolls
        \`${this.coins}\` Coins
        \`${this.arenaCoins}\` Arena Coins

        **Energy**
        ${this.energy}/${MAX_ENERGY} Battle Energy ${energyTimer}
        ${teamArenaEnergyText}

        **Buffs**
        ${this.buff?.name || "None"} ${buffTimer || ""}

        **Pet**
        ${petName}
        ${this.petStat || ""} ${petPassiveDesc ? `(${petPassiveDesc})` : ""}

        **Gear**
        ${this.gearStat || ""}
        ${armorBonusSetDesc}
      `);

    return embed;
  }

  // this adds or deduces the amount of coins of a player
  async addCoin(amount: number) {
    await setCoin(this.id, this.coins + amount);
    this.coins += amount;
  }

  async addArenaCoin(amount: number) {
    await setArenaCoin(this.id, this.arenaCoins + amount);
    this.arenaCoins += amount;
  }
}


