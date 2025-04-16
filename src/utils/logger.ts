/* eslint-disable no-console */
export const logger = {
  info: (message: string, ...args: unknown[]): void => {
    console.log(message, ...args);
  },
  error: (message: string, ...args: unknown[]): void => {
    console.error(message, ...args);
  },
  warn: (message: string, ...args: unknown[]): void => {
    console.warn(message, ...args);
  },
};
