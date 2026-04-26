/**
 * Browser shim for Node.js 'fs' module.
 * Provides stub implementations that throw helpful errors.
 *
 * This module is used for both 'fs' and 'fs/promises' imports.
 * All functions return promises since that's what the browser code expects.
 */

const notSupportedAsync = (name: string) => {
  return (..._args: unknown[]): Promise<never> => {
    return Promise.reject(
      new Error(`fs.${name} is not supported in browser environment`)
    );
  };
};

// For sync functions that might be called
const notSupportedSync = (name: string) => {
  return (..._args: unknown[]): never => {
    throw new Error(`fs.${name} is not supported in browser environment`);
  };
};

// Fake Stats object for statSync/lstatSync - returns false for all checks
class FakeStats {
  dev = 0;
  ino = 0;
  mode = 0;
  nlink = 0;
  uid = 0;
  gid = 0;
  rdev = 0;
  size = 0;
  blksize = 0;
  blocks = 0;
  atimeMs = 0;
  mtimeMs = 0;
  ctimeMs = 0;
  birthtimeMs = 0;
  atime = new Date(0);
  mtime = new Date(0);
  ctime = new Date(0);
  birthtime = new Date(0);

  isFile(): boolean {
    return false;
  }
  isDirectory(): boolean {
    return false;
  }
  isBlockDevice(): boolean {
    return false;
  }
  isCharacterDevice(): boolean {
    return false;
  }
  isSymbolicLink(): boolean {
    return false;
  }
  isFIFO(): boolean {
    return false;
  }
  isSocket(): boolean {
    return false;
  }
}

// Singleton fake stats instance
const fakeStats = new FakeStats();

// Export Stats class for libraries that reference fs.Stats
export const Stats = FakeStats;

// Async function stubs (used by fs/promises imports)
export const readFile = notSupportedAsync('readFile');
export const writeFile = notSupportedAsync('writeFile');
export const mkdir = notSupportedAsync('mkdir');
export const readdir = notSupportedAsync('readdir');
export const stat = notSupportedAsync('stat');
export const unlink = notSupportedAsync('unlink');
export const rmdir = notSupportedAsync('rmdir');
export const access = notSupportedAsync('access');
export const copyFile = notSupportedAsync('copyFile');
export const rename = notSupportedAsync('rename');
export const lstat = notSupportedAsync('lstat');
export const realpath = notSupportedAsync('realpath');
export const chmod = notSupportedAsync('chmod');
export const chown = notSupportedAsync('chown');
export const utimes = notSupportedAsync('utimes');
export const link = notSupportedAsync('link');
export const symlink = notSupportedAsync('symlink');
export const readlink = notSupportedAsync('readlink');
export const truncate = notSupportedAsync('truncate');
export const appendFile = notSupportedAsync('appendFile');
export const open = notSupportedAsync('open');
export const rm = notSupportedAsync('rm');

// Sync function stubs (used by direct fs imports)
export const readFileSync = notSupportedSync('readFileSync');
export const writeFileSync = notSupportedSync('writeFileSync');
export const existsSync = () => false;
export const mkdirSync = notSupportedSync('mkdirSync');
export const readdirSync = (): string[] => [];
// Return fake stats that say "not a file, not a directory" - used by is-directory and similar
export const statSync = (): FakeStats => fakeStats;
export const unlinkSync = notSupportedSync('unlinkSync');
export const rmdirSync = notSupportedSync('rmdirSync');
export const accessSync = notSupportedSync('accessSync');
export const copyFileSync = notSupportedSync('copyFileSync');
export const renameSync = notSupportedSync('renameSync');
// Return fake stats for lstatSync too
export const lstatSync = (): FakeStats => fakeStats;
export const realpathSync = notSupportedSync('realpathSync');

// Promises namespace (for `import { promises } from 'fs'`)
export const promises = {
  readFile,
  writeFile,
  mkdir,
  readdir,
  stat,
  unlink,
  rmdir,
  access,
  copyFile,
  rename,
  lstat,
  realpath,
  chmod,
  chown,
  utimes,
  link,
  symlink,
  readlink,
  truncate,
  appendFile,
  open,
  rm
};

// Constants
export const constants = {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
  COPYFILE_EXCL: 1,
  COPYFILE_FICLONE: 2,
  COPYFILE_FICLONE_FORCE: 4,
  O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  O_CREAT: 64,
  O_EXCL: 128,
  O_TRUNC: 512,
  O_APPEND: 1024,
  O_DIRECTORY: 65536,
  O_NOFOLLOW: 131072,
  O_SYNC: 1052672,
  O_DSYNC: 4096,
  O_SYMLINK: 2097152,
  O_NONBLOCK: 2048
};

// Default export (for `import fs from 'fs'`)
export default {
  readFile,
  writeFile,
  mkdir,
  readdir,
  stat,
  unlink,
  rmdir,
  access,
  copyFile,
  rename,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  rmdirSync,
  accessSync,
  copyFileSync,
  renameSync,
  lstatSync,
  realpathSync,
  lstat,
  promises,
  constants,
  Stats
};
