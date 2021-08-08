import EventEmitter from "events";

type Listener = (msg: string, info?: Record<string, unknown>) => void;
enum Level {
  INFO = "INFO",
  DEBUG = "DEBUG",
  WARN = "WARN",
  ERROR = "ERROR",
}

export declare interface Log {
  on(event: Level.INFO, listener: Listener): this;
  on(event: Level.DEBUG, listener: Listener): this;
  on(event: Level.WARN, listener: Listener): this;
  on(event: Level.ERROR, listener: Listener): this;
}

export class Log extends EventEmitter {

  log(level: Level, msg: string, info?: Record<string, unknown>) {
    const logText = `[${Level}] ${msg}: ${info || ""}`;
    this.emit(level, logText, info);
  }

  logInfo(msg: string, info?: Record<string, unknown>) {
    this.log(Level.INFO, msg, info);
  }

  logDebug(msg: string, info?: Record<string, unknown>) {
    this.log(Level.DEBUG, msg, info);
  }

  logWarn(msg: string, info?: Record<string, unknown>) {
    this.log(Level.WARN, msg, info);
  }

  logError(msg: string, info?: Record<string, unknown>) {
    this.log(Level.ERROR, msg, info);
  }
}


