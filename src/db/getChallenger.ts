import { dbGet } from "./promiseWrapper";
import { db } from "../index";

export interface Challenger {
  ID: number;
  Name: string;
  Loot: number;
  HP: number;
  Strength: number;
  Speed: number;
  Armor: number;
  CritChance: number;
}

export async function getChallenger(level: number) {

  const sql = `
    SELECT *
    FROM Challenger
    WHERE ID = ${level}
  `;

  return dbGet<Challenger>(db, sql);
}
