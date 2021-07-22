import { addInventory, removeInventory } from "./inventory";
import { dbAll, dbRun } from "./promiseWrapper"

export interface Gear {
  ID: number;
  OwnerID: string;
  Created: string;
  GearID: string;
}

export async function equipGear($userID: string, $itemID: string) {
  const sql = `
  INSERT INTO Gear (OwnerID, GearID)
  VALUES ($userID, $itemID)
  `

  await dbRun(sql, { $userID, $itemID });
  await removeInventory($userID, $itemID);
}

export async function unequipGear($userID: string, $itemID: string) {
  let sql = `
  DELETE FROM Gear
  WHERE OwnerID = $userID AND GearID = $itemID
  `

  await dbRun(sql, { $userID, $itemID });
  await addInventory($userID, $itemID);
}

export function getGears($userID: string) {
  const sql = `
  SELECT * FROM Gear
  WHERE OwnerID = $userID
  `

  return dbAll<Gear>(sql, { $userID });
}
