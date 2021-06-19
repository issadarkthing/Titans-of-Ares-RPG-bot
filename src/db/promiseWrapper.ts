import { Database } from "sqlite3";

export function dbAll<T>(db: Database, sql: string) {
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

export function dbExec(db: Database, sql: string) {
  return new Promise<void>((resolve, reject) => {
    return db.exec(sql, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  })
}

