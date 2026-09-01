import { executeRunServerIfMain } from './index';

export { executeRunServerIfMain };

/**
 * Passes the current module execution context to the main route check.
 * @param mainFilename The filename returned by require.main?.filename.
 * @param currentFilename The filename of this module.
 */
export function executeServerIfMain(
  mainFilename: string | undefined = require.main?.filename,
  currentFilename: string = __filename
): void {
  executeRunServerIfMain(mainFilename, currentFilename);
}

executeServerIfMain();
