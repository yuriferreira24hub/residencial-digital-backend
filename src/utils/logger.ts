export const logger = {
  log: (...params: any[]) => console.log('[LOG]', ...params),
  error: (...params: any[]) => console.error('[ERROR]', ...params),
};
