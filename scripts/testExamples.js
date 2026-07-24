/* eslint-disable no-console */
/**
 * Smoke-test every example against the current CLI build.
 *
 * For each `examples/*` that has a package.json:
 *   1. `npm ci`
 *   2. if it depends on `@the-codegen-project/cli`, install the freshly-packed
 *      local build over it (so it exercises this working copy, not the registry)
 *   3. `npm run generate`
 *
 * This is intentionally generation-only: compilation of generated output is
 * covered comprehensively by the blackbox tier, and running each example's own
 * build couples this check to per-example app toolchains/deps (Next.js, ajv, …)
 * rather than the CLI.
 *
 * Run it yourself with `npm run test:examples` — CI runs the exact same script.
 */
const {execFileSync, execSync} = require('node:child_process');
const {readdirSync, readFileSync, existsSync, rmSync} = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const examplesDir = path.join(root, 'examples');

function run(command, cwd) {
  console.log(`$ ${command}  (in ${path.relative(root, cwd) || '.'})`);
  execSync(command, {cwd, stdio: 'inherit'});
}

function dependsOnCli(pkg) {
  const deps = {...pkg.dependencies, ...pkg.devDependencies};
  return Boolean(deps['@the-codegen-project/cli']);
}

// Build and pack the CLI so examples that depend on it use this working copy.
run('npm run build', root);
const packOutput = execFileSync('npm', ['pack', '--json'], {
  cwd: root,
  encoding: 'utf8'
});
const tarball = path.join(root, JSON.parse(packOutput)[0].filename);
console.log(`Packed CLI tarball: ${tarball}`);

const failures = [];
try {
  for (const name of readdirSync(examplesDir).sort()) {
    const dir = path.join(examplesDir, name);
    const pkgPath = path.join(dir, 'package.json');
    if (!existsSync(pkgPath)) {
      continue;
    }
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    console.log(`\n=== ${name} ===`);
    try {
      run('npm ci', dir);
      if (dependsOnCli(pkg)) {
        // `--no-save` installs the tarball into node_modules without rewriting
        // the example's package.json/lock, so running this locally does not
        // dirty the committed examples.
        run(`npm install "${tarball}" --no-save`, dir);
      }
      run('npm run generate', dir);
    } catch (error) {
      console.error(`✗ ${name} failed: ${error.message}`);
      failures.push(name);
    }
  }
} finally {
  // Clean up the packed tarball regardless of outcome.
  rmSync(tarball, {force: true});
}

if (failures.length > 0) {
  console.error(`\nExamples failed: ${failures.join(', ')}`);
  process.exit(1);
}
console.log('\nAll examples generated successfully.');
