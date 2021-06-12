import { Database } from "sqlite3";

export default function promiseWrapper<T>(db: Database, sql: string) {
  return new Promise<T[]>((resolve, reject) => {
    return db.all(sql, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

