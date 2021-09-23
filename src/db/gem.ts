import { DateTime } from "luxon";
import { RoughStone } from "../internals/Mining";
import { addInventory } from "./inventory";
import { dbAll, dbGet, dbRun } from "./promiseWrapper";

export interface GemDB {
  ID: number;
  Created: string;
  InventoryID: number;
  ItemID: string;
  GearID?: string;
}

export async function getGem($userID: string, $itemID: string) {
  const sql = `
  SELECT 
    Gem.ID,
    Gem.Created,
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

  if ($itemID === (new RoughStone()).id) {
    await addInventory($userID, $itemID);
    return;
  }
  
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

export async function getAllSocketedGem($userID: string) {
  const sql = `
  SELECT 
    Gem.ID,
    Gem.Created,
    InventoryID,
    Inventory.ItemID AS ItemID,
    GearID
  FROM Gem
  INNER JOIN Inventory
  ON Inventory.ID = Gem.InventoryID
  WHERE Inventory.OwnerID = $userID AND GearID != ''
  `

  return dbAll<GemDB>(sql, { $userID });
}

export async function getAllGems($userID: string) {
  const sql = `
  SELECT 
    Gem.ID,
    Gem.Created,
    InventoryID,
    Inventory.ItemID AS ItemID,
    GearID
  FROM Gem
  INNER JOIN Inventory
  ON Inventory.ID = Gem.InventoryID
  WHERE Inventory.OwnerID = $userID
  `

  return dbAll<GemDB>(sql, { $userID });
}

export async function socketGem($gemInventoryID: number, $gearID: string) {
  const sql = `
    UPDATE Gem 
    SET GearID = $gearID
    WHERE InventoryID = $gemInventoryID
  `

  return dbRun(sql, { $gemInventoryID, $gearID });
}

export async function desocketGem($gemInventoryID: number) {
  const sql = `
    UPDATE Gem 
    SET GearID = NULL
    WHERE InventoryID = $gemInventoryID
  `

  return dbRun(sql, { $gemInventoryID });
}

export async function setMiningPickReward($userID: string, $upperLimit: number) {
  const sql = `
  UPDATE Player
  SET MiningPickReward = $upperLimit
  WHERE DiscordID = $userID
  `

  return dbRun(sql, { $userID, $upperLimit });
}
