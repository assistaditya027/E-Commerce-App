const baseLog = (level, event, data = {}) => {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...data,
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

export const logInfo = (event, data) => baseLog('info', event, data);
export const logWarn = (event, data) => baseLog('warn', event, data);
export const logError = (event, data) => baseLog('error', event, data);
