import { dbGet } from "./promiseWrapper";

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

export const makeChallengerTable = `
  CREATE TABLE IF NOT EXISTS Challenger (
    ID         INTEGER PRIMARY KEY,
    Name       TEXT,
    Loot       INT,
    HP         INT,
    Strength   INT,
    Speed      INT,
    Armor      INT,
    CritChance REAL
  )
`;

export async function getChallenger($level: number) {

  const sql = `
    SELECT *
    FROM Challenger
    WHERE ID = $level
  `;

  return dbGet<Challenger>(sql, { $level });
}
