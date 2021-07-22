import { dbAll, dbRun } from "./promiseWrapper"

export interface Gear {
  ID: number;
  OwnerID: string;
  Created: string;
  GearID: string;
}

export function equipGear($userID: string, $itemID: string) {
  const sql = `
  INSERT INTO Gear (OwnerID, GearID)
  VALUES ($userID, $itemID)
  `

  return dbRun(sql, { $userID, $itemID });
}

export function getGears($userID: string) {
  const sql = `
  SELECT * FROM Gear
  WHERE OwnerID = $userID
  `

  return dbAll<Gear>(sql, { $userID });
}
