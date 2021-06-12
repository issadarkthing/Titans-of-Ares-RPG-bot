import { db } from "../index";
import promisify from "./promiseWrapper";

interface Row {
  Day: number;
  Value: number;
  ValueType: string;
  ChallengeID: number;
}

export function getActivity(userId: string) {

  const sql = `
  SELECT ChallengeEntry.ChallengeID,
         DayEntry.Day, 
         DayEntry.Value, 
         DayEntry.ValueType 
  FROM DayEntry 
  INNER JOIN ChallengeEntry ON DayEntry.EntryID = ChallengeEntry.ID 
    WHERE ChallengeEntry.DiscordID = ${userId} 
  `
  return promisify<Row>(db, sql);
}

interface Row1 extends Row {
  DiscordID: string;
}

export function getActivities() {
  
  const sql = `
  SELECT ChallengeEntry.ChallengeID,
         CAST(ChallengeEntry.DiscordID AS text) as DiscordID,
         DayEntry.Day, 
         DayEntry.Value, 
         DayEntry.ValueType 
  FROM DayEntry 
  INNER JOIN ChallengeEntry ON DayEntry.EntryID = ChallengeEntry.ID 
  WHERE ChallengeEntry.ChallengeID != 1
  `

  return promisify<Row1>(db, sql);
}
