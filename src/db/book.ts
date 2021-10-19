import { dbAll, dbRun } from "./promiseWrapper"

interface BookRaw {
  ID: number;
  DiscordID: string;
  ChallengeID: number;
  Day: number;
  Name: string;
  Lesson: string;
  Evaluation?: string;
  Finished: number;
}

export type Book = Omit<BookRaw, "Finished"> & { Finished: boolean };


export async function getAllBooks($userID: string): Promise<Book[]> {
  const sql = `
    SELECT * FROM Book 
    WHERE DiscordID = $userID
  `

  const books = await dbAll<BookRaw>(sql, { $userID });
  return books.map(x => ({ ...x, Finished: Boolean(x.Finished) })) as Book[];
}

export class UnfinishedBookError extends Error {
  book: Book;

  constructor(message: string, book: Book) {
    super(message);
    this.name = "UnfinishedBookError";
    this.book = book;
  }
}

export interface BookOptions {
  $userID: string;
  $challengeID: number;
  $day: number;
  $name: string;
  $lesson: string;
}

export async function registerBook(options: BookOptions) {

  const books = await getAllBooks(options.$userID);

  for (const book of books) {
    if (!book.Finished) {
      throw new UnfinishedBookError("unfinished book", book);
    }
  }

  const sql = `
    INSERT INTO Book (DiscordID, ChallengeID, Day, Name, Lesson)
    VALUES ($userID, $challengeID, $day, $name, $lesson)
  `

  return dbRun(sql, { ...options });
}

export async function removeBook($bookID: number) {
  const sql = `
    DELETE FROM Book WHERE ID = $bookID
  `

  return dbRun(sql, { $bookID });
}

export async function finishBook($bookID: number, $evaluation: string) {
  const sql = `
    UPDATE Book
    SET Finished = 1, Evaluation = $evaluation
    WHERE ID = $bookID
  `

  return dbRun(sql, { $bookID, $evaluation });
}
