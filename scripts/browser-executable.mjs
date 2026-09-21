import {existsSync} from 'node:fs';
const macChrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
/** Override on any OS, otherwise prefer installed macOS Chrome or Playwright Chromium. */
export const browserExecutable=process.env.PLAYWRIGHT_CHROME_EXECUTABLE||(existsSync(macChrome)?macChrome:undefined);
