import { dbExec } from "./promiseWrapper";
import { db } from "../index";

export function award(userId: string, amount: number) {

  const sql = `
    UPDATE XP
    SET XP = XP + ${amount}
    WHERE DiscordID = ${userId}
  `

  return dbExec(db, sql);
}
