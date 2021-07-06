import { dbGet, dbRun } from "./promiseWrapper"

interface Profile {
  DiscordID: string;
  Checksum: string;
  Data: Buffer;
}


export function getProfile($userID: string) {
  const sql = `
  SELECT *
  FROM Profile
  WHERE DiscordID = $userID
  `
  return dbGet<Profile>(sql, { $userID });
}

export function setProfile($userID: string, $checksum: string, $data: Buffer) {
  const sql = `
  INSERT OR REPLACE INTO Profile (DiscordID, Checksum, Data)
  VALUES ($userID, $checksum, $data) 
  `
  return dbRun(sql, { $userID, $checksum, $data });
}
