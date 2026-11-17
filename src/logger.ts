type LogLevel = 'info' | 'warn' | 'error';

type LogFields = Record<string, string | number | undefined>;

function writeLog(level: LogLevel, fields: LogFields): void {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    ...fields,
  });

  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info: (fields: LogFields) => writeLog('info', fields),
  warn: (fields: LogFields) => writeLog('warn', fields),
  error: (fields: LogFields) => writeLog('error', fields),
};
