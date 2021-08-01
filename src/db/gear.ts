import { dbAll, dbRun } from "./promiseWrapper"

export interface Gear {
  ID: number;
  InventoryID: number;
  Equipped: boolean;
  Level: number;
  OwnerID: string;
  Created: string;
  ItemID: string;
}

const update = (stmt: string) => `
  UPDATE Gear
  SET ${stmt}
  WHERE InventoryID = (
    SELECT ID 
    FROM Inventory 
    WHERE OwnerID = $userID AND ItemID = $itemID
    LIMIT 1
  )
  `


export function equipGear($userID: string, $itemID: string) {
  const sql = update("Equipped = TRUE");

  return dbRun(sql, { $userID, $itemID });
}

export function unequipGear($userID: string, $itemID: string) {
  const sql = update("Equipped = FALSE");

  return dbRun(sql, { $userID, $itemID });
}

export function levelupGear($userID: string, $itemID: string) {
  const sql = update("Level = Level + 1");

  return dbRun(sql, { $userID, $itemID });
}

export async function addGear($inventoryID: number) {
  const sql = `
  INSERT INTO Gear (InventoryID)
  VALUES ($inventoryID)
  `

  return dbRun(sql, { $inventoryID });
}

type GearRaw = { Equipped: number } & Omit<Gear, "Equipped">;
export async function getGears($userID: string) {
  const sql = `
  SELECT * FROM Gear
  INNER JOIN Inventory
  ON Gear.InventoryID = Inventory.ID
  WHERE Inventory.OwnerID = $userID
  `

  const gears = await dbAll<GearRaw>(sql, { $userID });
  return gears.map((x: GearRaw) => ({ ...x, Equipped: !!x.Equipped })) as Gear[];
}
