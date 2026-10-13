/**
 * Regenerates `.expo/types/router.d.ts` (Expo Router typed routes) directly
 * from the filesystem route tree.
 *
 * Why this is needed: `expo export` deterministically writes a polluted
 * declaration file on Windows. The typed-routes watch handler in
 * `@expo/router-server` computes `path.relative()` against the app root and
 * only rejects files outside the app directory with a POSIX `../` check. On
 * Windows the separator is `..\`, so that guard never fires:
 *
 *   - Files outside `src/app` (e.g. `src/features/**`) are added to the route
 *     context, producing junk `/../features/...` route entries.
 *   - Route files added through the watcher are stored with backslash keys,
 *     and the generator strips the trailing `/index` *before* normalizing
 *     separators, which leaves un-stripped `/inventory/index` entries in place
 *     of the bare `/inventory` route (and drops its dynamic `/[param]`
 *     variants). `tsc` then fails with TS2345 on every `router.push(...)`.
 *
 * Running this script after `expo export` restores the correct types:
 *
 *   node scripts/regenerate-router-types.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');

const appRoot = path.resolve(path.dirname(require.main.filename), '..');
const appRequire = createRequire(path.join(appRoot, 'package.json'));

// Same value the CLI sets before generating typed routes
// (see @expo/cli `start/server/type-generation/routes.js`).
process.env.EXPO_ROUTER_APP_ROOT = path.join(appRoot, 'src', 'app');

const { requireContext } = appRequire('expo-router/internal/testing');
const { EXPO_ROUTER_CTX_IGNORE } = appRequire('expo-router/_ctx-shared');

// The generator ships inside the `@expo/cli` copy nested under `expo`.
const cliRequire = createRequire(
  path.join(appRoot, 'node_modules', 'expo', 'node_modules', '@expo', 'cli', 'package.json'),
);
const generate = cliRequire('@expo/router-server/build/typed-routes/generate');

const ctx = requireContext(process.env.EXPO_ROUTER_APP_ROOT, true, EXPO_ROUTER_CTX_IGNORE);
const declaration = generate.getTypedRoutesDeclarationFile(ctx, {});

if (!declaration || !declaration.includes('hrefInputParams') || !declaration.includes('/login')) {
  console.error('Typed routes generation produced an unexpected result; refusing to write.');
  process.exit(1);
}

const typesDir = path.join(appRoot, '.expo', 'types');
fs.mkdirSync(typesDir, { recursive: true });
const outputPath = path.join(typesDir, 'router.d.ts');
fs.writeFileSync(outputPath, declaration);
console.log(`Wrote ${path.relative(appRoot, outputPath)} (${declaration.length} bytes).`);
