import { dbRun } from "./promiseWrapper";
import { MedalType } from "../internals/Medal";

// increments the medal of user by the given amount
// use negative value to decrement
export function addMedal(
  $userID: string, 
  medalType: MedalType, 
  $amount: number,
) {

  const sql = `
  UPDATE Player
  SET ${medalType} = ${medalType} + $amount
  WHERE DiscordID = $userID
  `

  return dbRun(sql, { $userID, $amount });
}

