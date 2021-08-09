import { DateTime } from "luxon";
import { dbAll, dbGet, dbRun } from "./promiseWrapper";

interface TeamArena {
  ID: number;
  Created: string;
  Phase: string;
}

interface TeamArenaMember {
  ID: number;
  Created: string;
  TeamArenaID: number;
  DiscordID: string;
  Charge: number;
  Team: string;
}

export function createArena($dateISO: string) {
  const sql = `
    INSERT INTO TeamArena (Created)
    VALUES ($dateISO)
  `

  return dbRun(sql, { $dateISO });
}

export function getCurrentArena() {
  const sql = `
    SELECT * FROM TeamArena LIMIT 1
  `

  return dbGet<TeamArena>(sql);
}

export function getCandidates($arenaID: number) {
  const sql = `
    SELECT * FROM TeamArenaMember WHERE TeamArenaID = $arenaID
  `

  return dbAll<TeamArenaMember>(sql, { $arenaID });
}

export function deduceCharge($arenaID: number, $discordID: string) {
  const sql = `
  UPDATE TeamArenaMember
  SET Charge = Charge - 1
  WHERE TeamArenaID = $arenaID AND DiscordID = $discordID
  `

  return dbRun(sql, { $arenaID, $discordID });
}

export function updatePoint($arenaID: number, $discordID: string, $amount: number) {
  const sql = `
  UPDATE TeamArenaMember
  SET Point = Point + $amount
  WHERE TeamArenaID = $arenaID AND DiscordID = $discordID
  `

  return dbRun(sql, { $arenaID, $discordID, $amount });
}

export function joinArena($arenaID: number, $discordID: string) {
  const $now = DateTime.now().toISO();
  const sql = `
    INSERT INTO TeamArenaMember (Created, TeamArenaID, DiscordID)
    VALUES ($now, $arenaID, $discordID)
  `

  return dbRun(sql, { $now, $arenaID, $discordID });
}
