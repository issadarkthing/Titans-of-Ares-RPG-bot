import { DateTime } from "luxon";
import { dbAll, dbGet, dbRun } from "./promiseWrapper";

export interface TeamArena {
  ID: number;
  Created: string;
  Phase: string;
  MessageID: string;
}

export interface TeamArenaMember {
  ID: number;
  Created: string;
  TeamArenaID: number;
  DiscordID: string;
  Charge: number;
  Team: string;
  Score: number;
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
  SET Score = Score + $amount
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

export function leaveArena($arenaID: number, $discordID: string) {
  const sql = `
    DELETE FROM TeamArenaMember
    WHERE TeamArenaID = $arenaID AND DiscordID = $discordID
  `

  return dbRun(sql, { $arenaID, $discordID });
}

export function addArenaCoin($discordID: string, $amount: number) {
  const sql = `
  UPDATE Player
  SET ArenaCoin = ArenaCoin + $amount
  WHERE DiscordID = $discordID
  `

  return dbRun(sql, { $discordID, $amount });
}

export function setPhase($arenaID: number, $phase: string) {
  const sql = `
  UPDATE TeamArena
  SET Phase = $phase
  WHERE ID = $arenaID
  `

  return dbRun(sql, { $arenaID, $phase });
}

export function setTeam($arenaID: number, $discordID: string, $team: string) {
  const sql = `
  UPDATE TeamArenaMember
  SET Team = $team
  WHERE TeamArenaID = $arenaID AND DiscordID = $discordID
  `

  return dbRun(sql, { $arenaID, $discordID, $team });
}

export function setMessage($arenaID: number, $messageID: string) {
  const sql = `
  UPDATE TeamArena
  SET MessageID = $messageID
  WHERE ID = $arenaID
  `

  return dbRun(sql, { $arenaID, $messageID });
}
