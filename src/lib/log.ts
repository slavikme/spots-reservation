type LogLevel = "Info" | "Warn" | "ERROR";

let measuring = false;

interface Logger {
  (message: string): void;
  measure: <T>(message: string, measureBlock: () => Promise<T>) => Promise<T>;
  warn: (message: string) => void;
  error: (message: string, error?: unknown) => void;
}

const getTimestamp = (data: Date = new Date()) => {
  return data.toISOString().replace("T", " ").replace("Z", " UTC");
};

const writeRaw = (message: string) => {
  if (!message) {
    return;
  }
  measuring = false;
  process.stdout.write(message);
};

const write = (group: string, level: LogLevel, message: string) => {
  writeRaw(`${getTimestamp()} ${level}: ${group} ${message}`);
};

const writeLine = (group: string, level: LogLevel, message: string) => {
  write(group, level, message);
  writeRaw(`\n`);
};

export const logger = (group: string): Logger => {
  const log = (message: string): void => {
    writeLine(group, "Info", message);
  };

  log.measure = async <T>(
    message: string,
    measureBlock: () => Promise<T>
  ): Promise<T> => {
    const startTime = new Date();
    write(group, "Info", message);
    measuring = true;
    const result = await measureBlock();
    const duration = Date.now() - startTime.getTime();
    if (measuring) {
      writeRaw(` (${duration}ms)\n`);
    } else {
      writeLine(group, "Info", `${message} (${duration}ms)`);
    }
    return result;
  };

  log.warn = (message: string) => {
    writeLine(group, "Warn", message);
  };

  log.error = (message: string, error?: unknown) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    writeLine(group, "ERROR", `${message} ${errorMessage}`);
  };

  return log;
};
