import { db } from "../index";

export function dbAll<T>(sql: string, param?: object) {
  return new Promise<T[]>((resolve, reject) => {
    return db.all(sql, param, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

export function dbGet<T>(sql: string, param?: object) {
  return new Promise<T>((resolve, reject) => {
    return db.get(sql, param, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

export function dbRun(sql: string, param?: object) {
  return new Promise<void>((resolve, reject) => {
    return db.run(sql, param, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  })
}

