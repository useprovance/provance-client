const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const DIM = "\x1b[2m";

export const logger = {
  info: (route: string, msg: string) =>
    console.log(`${CYAN}[${route}]${RESET} ${msg}`),

  warn: (route: string, msg: string) =>
    console.warn(`${YELLOW}[${route}]${RESET} ${msg}`),

  error: (route: string, msg: string, err?: unknown) => {
    console.error(`${RED}[${route}] ERROR:${RESET} ${msg}`);
    if (err) {
      if (err instanceof Error) {
        console.error(`${DIM}  → ${err.message}${RESET}`);
        if (err.stack) console.error(`${DIM}${err.stack}${RESET}`);
      } else {
        console.error(`${DIM}  → ${JSON.stringify(err, null, 2)}${RESET}`);
      }
    }
  },
};
