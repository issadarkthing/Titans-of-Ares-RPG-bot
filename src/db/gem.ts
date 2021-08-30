import { DateTime } from "luxon";
import { addInventory } from "./inventory";
import { dbGet, dbRun } from "./promiseWrapper";

export interface GemDB {
  ID: number;
  Created: string;
  InventoryID: number;
  ItemID: string;
  GearID?: number;
}

export async function getGem($userID: string, $itemID: string) {
  const sql = `
  SELECT 
    ID,
    Created,
    InventoryID,
    Inventory.ItemID AS ItemID,
    GearID
  FROM Gem
  INNER JOIN Inventory
  ON Inventory.ID = Gem.InventoryID
  WHERE Inventory.OwnerID = $userID AND Inventory.ItemID = $itemID
  `

  return dbGet<GemDB>(sql, { $userID, $itemID });
}

export async function addGem($userID: string, $itemID: string) {
  
  const $inventoryID = await addInventory($userID, $itemID);
  const $created = DateTime.now().toISO();

  const sql = `
  INSERT INTO Gem (Created, InventoryID)
  VALUES ($created, $inventoryID)
  `;

  await dbRun(sql, { $inventoryID, $created });
}

export async function removeGem($userID: string, $itemID: string) {

  const gem = await getGem($userID, $itemID);
  const $gemID = gem.ID;
  const $inventoryID = gem.InventoryID;
  
  let sql = `
    DELETE FROM Inventory WHERE ID = $inventoryID
  `
  await dbRun(sql, { $inventoryID });

  sql = `
    DELETE FROM Gem WHERE ID = $gemID
  `

  await dbRun(sql, { $gemID });
}
