import { dbAll, dbRun } from "./promiseWrapper"

export interface Item {
  ID: number;
  OwnerID: string;
  Created: string;
  ItemID: string;
}

export async function addInventory($userID: string, $itemID: string, count = 1) {
  const sql = `
  INSERT INTO Inventory (OwnerID, ItemID)
  VALUES ($userID, $itemID)
  `

  let result: number;

  await dbRun("BEGIN TRANSACTION");
  for (let i = 0; i < count; i++) {
    result = await dbRun(sql, { $userID, $itemID });
  }
  await dbRun("COMMIT");

  return result!;
}

export async function removeInventory($ownerID: string, $itemID: string, count = 1) {
  const sql = `
  DELETE FROM Inventory
  WHERE ID = (
    SELECT ID 
    FROM Inventory 
    WHERE OwnerID = $ownerID AND ItemID = $itemID 
    LIMIT 1)
  `

  await dbRun("BEGIN TRANSACTION");
  for (let i = 0; i < count; i++) {
    await dbRun(sql, { $ownerID, $itemID });
  }
  await dbRun("COMMIT");
}

export function getInventory($userID: string) {
  const sql = `
  SELECT
    Inventory.ID as ID,
    OwnerID,
    Created,
    ItemID,
    Gear.Level,
    Gear.Equipped
  FROM Inventory 
  LEFT JOIN Gear
  ON Gear.InventoryID = Inventory.ID
  WHERE 
    IIF(Gear.Equipped = 0 OR Gear.Equipped = 1, 
      Gear.Equipped = 0 AND Inventory.OwnerID = $userID, 
      Inventory.OwnerID = $userID)
  `

  return dbAll<Item>(sql, { $userID });
}
