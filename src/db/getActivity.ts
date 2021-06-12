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
