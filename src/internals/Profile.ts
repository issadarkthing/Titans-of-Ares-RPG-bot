import { backgrounds } from "../commands/rank";
import { getLevelThreshold, hash } from "./utils";
import Rankcard from "@jiman24/rankcard";
import { MessageAttachment } from "discord.js";
import { getProfile, setProfile } from "../db/profile";

interface ProfileInfo {
  name: string;
  xp: number;
  level: number;
  rank: number;
  imageUrl: string;
  userID: string;
  gold: number;
  silver: number;
  bronze: number;
}

export class Profile {

  private xp: number;
  private level: number;
  private rank: number;
  private imageUrl: string;
  private name: string;
  private userID: string;
  private gold: number;
  private silver: number;
  private bronze: number;

  constructor(data: ProfileInfo) {
    this.xp = data.xp;
    this.level = data.level;
    this.rank = data.rank;
    this.imageUrl = data.imageUrl;
    this.name = data.name;
    this.userID = data.userID;
    this.gold = data.gold;
    this.silver = data.silver;
    this.bronze = data.bronze;
  }

  get id() {

    let tmp = "";
    for (const attribute in this) {
      const val = this[attribute];
      tmp += `_${val}`;
    }

    return hash(tmp);
  }

  async build() {

    const cache = await getProfile(this.userID);
    if (cache?.Checksum === this.id)
      return new MessageAttachment(cache.Data, `${this.id}.png`);

    const xp = this.xp;
    const level = this.level;
    const levelThreshold = getLevelThreshold(level);
    const rank = this.rank;
    const color = "#23272a";
    const image = backgrounds[rank - 1];

    let accPrevLevel = 0; // total xp needed for previous level
    let lvl = level;

    while (lvl > 1)
      accPrevLevel += getLevelThreshold(--lvl);

    const rankCard = await new Rankcard.Rank()
      .setAvatar(this.imageUrl)
      .setCurrentXP(Math.round(xp - accPrevLevel))
      .setRequiredXP(Math.round(levelThreshold))
      .setLevel(level)
      .setRank(rank, "")
      .setProgressBar("#ff0800", "COLOR", false)
      .setOverlay(image ? "#000" : "#fff", image ? 0.5 : 0.05)
      .setUsername(this.name)
      .setBackground(image ? "IMAGE" : "COLOR", image || color)
      .setBronze(this.bronze)
      .setSilver(this.silver)
      .setGold(this.gold)
      .build();

    setProfile(this.userID, this.id, rankCard);
    return new MessageAttachment(rankCard, `${this.id}.png`);
  }
}
