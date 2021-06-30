import { dbAll, dbGet, dbRun } from "./promiseWrapper";

export enum TimerType {
  Energy = "charge",
  Buff   = "buff",
}


export interface Timer {
  DiscordID: string;
  Name: string; // the name of the timer
  Created: string;
  Expires: string;
}

export function deleteTimer($name: TimerType, $userID: string) {
  const sql = `
  DELETE FROM Timer
  WHERE Name = $name AND DiscordID = $userID
  `

  dbRun(sql, { $name, $userID });
}

export function getAllTimers($name: TimerType) {
  const sql = `
  SELECT * FROM Timer WHERE Name = $name
  `
  return dbAll<Timer>(sql, { $name });
}

// increments user energy and returns total energy a user has
export async function setEnergy($userID: string, $amount: number) {

  const sql = `
  UPDATE Player
  SET Energy = Energy + $amount
  WHERE DiscordID = $userID
  `;

  await dbRun(sql, { $amount, $userID });

  const energySql = `
  SELECT Energy
  FROM Player
  WHERE DiscordID = $userID
  `

  return dbGet<{ Energy: number }>(energySql, { $userID })
    .then(x => x.Energy);
}

export async function hasTimer($name: TimerType, $userID: string) {
  const sql = `
  SELECT COUNT(*) AS Count
  FROM Timer
  WHERE DiscordID = $userID AND Name = $name
  `

  return dbGet<{ Count: number }>(sql, { $name, $userID })
    .then(x => x.Count > 0);
}

// Sets a timer in database. $expires is the expiry date in ISO string
export function setTimer($name: TimerType, $userID: string, $expires: string) {
  const sql = `
  INSERT INTO Timer (DiscordID, Name, Expires)
  VALUES ($userID, $name, $expires)
  `

  return dbRun(sql, { $name, $userID, $expires });
}

export function getTimer($name: TimerType, $userID: string) {
  const sql = `
  SELECT * FROM Timer WHERE Name = $name AND DiscordID = $userID
  `
  return dbGet<Timer>(sql, { $name, $userID });
}
