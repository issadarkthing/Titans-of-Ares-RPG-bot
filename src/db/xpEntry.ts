import { dbGet, dbRun } from "./promiseWrapper"

interface XPEntry {
  ID: number;
  ChallengeID: number;
  Day: number;
  XP: number;
  DiscordID: string;
}

export async function createEntry(
  $challengeID: number, 
  $day: number, 
  $userID: string,
  $xp: number,
) {

  const sql = `
  INSERT INTO XPEntry (ChallengeID, Day, XP, DiscordID)
  VALUES ($challengeID, $day, $xp, $userID)
  `

  return dbRun(sql, { $challengeID, $day, $xp, $userID });
}

export async function setXPEntry(
  $id: number,
  $xp: number,
) {
  const sql = `
  UPDATE XPEntry
  SET XP = XP + $xp
  WHERE ID = $id
  `

  return dbRun(sql, { $id, $xp });
}

export async function getXPEntry(
  $challengeID: number,
  $day: number,
  $userID: string,
) {

  const sql = `
  SELECT *
  FROM XPEntry
  WHERE 
    ChallengeID = $challengeID AND
    Day = $day AND
    DiscordID = $userID
  `

  return dbGet<XPEntry>(sql, { $userID, $challengeID, $day });
}

export async function resetXPEntry(
  $challengeID: number, 
  $day: number,
  $userID: string,
) {
  const sql = `
  UPDATE XPEntry
  SET XP = 0
  WHERE 
    ChallengeID = $challengeID AND
    Day = $day AND
    DiscordID = $userID
  `

  return dbRun(sql, { $userID, $day, $challengeID });
}
