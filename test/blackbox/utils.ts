/* eslint-disable no-undef */
import { promisify } from 'util';
import { exec, ExecException } from 'child_process';
const promiseExec = promisify(exec);

/**
 * Execute a command and if any errors occur reject the promise.
 *
 * @param command
 */
export async function execCommand(
  command: string,
  allowStdError = false
): Promise<void> {
  try {
    const { stderr } = await promiseExec(command);
    if (stderr !== '') {
      if (!allowStdError) {
        return Promise.reject(stderr);
      }
      // eslint-disable-next-line no-console
      console.warn(stderr);
    }
    return Promise.resolve();
  } catch (e: any) {
    if(e.code === 0) return Promise.resolve();
    return Promise.reject(`CODE: ${e.code} | ${e.stack}; Stdout: ${e.stdout}`);
  }
}
