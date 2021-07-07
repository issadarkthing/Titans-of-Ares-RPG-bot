import { dbAll, dbRun } from "./promiseWrapper"

export interface Item {
  ID: number;
  OwnerID: string;
  Created: string;
  ItemID: string;
}

export function addInventory($userID: string, $itemID: string) {
  const sql = `
  INSERT INTO Inventory (OwnerID, ItemID)
  VALUES ($userID, $itemID)
  `

  return dbRun(sql, { $userID, $itemID });
}

export function getInventory($userID: string) {
  const sql = `
  SELECT * FROM Inventory WHERE OwnerID = $userID
  `

  return dbAll<Item>(sql, { $userID });
}
