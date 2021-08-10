import { client } from "../main";

export function dbAll<T>(sql: string, param?: Record<string, unknown>) {
  return new Promise<T[]>((resolve, reject) => {
    return client.db.all(sql, param, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

export function dbGet<T>(sql: string, param?: Record<string, unknown>) {
  return new Promise<T>((resolve, reject) => {
    return client.db.get(sql, param, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

export function dbRun(sql: string, param?: Record<string, unknown>) {
  return new Promise<number>((resolve, reject) => {
    return client.db.run(sql, param, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.lastID);
      }
    })
  })
}

