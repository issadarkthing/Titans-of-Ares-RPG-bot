import { db } from "../index";
import { dbAll } from "./promiseWrapper";

export default async function(userId: string) {

  const sql = `
    SELECT 1
    FROM AdminRole
    WHERE ID = ${userId}
  `

  const result = await dbAll(db, sql);
  return result.length > 0;
}
