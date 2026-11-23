import { mkdir, copyFile, readdir, appendFile, readFile, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dir, '..');
const output = resolve(root, 'g2/dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
const result = await Bun.build({
  entrypoints: [resolve(root, 'g2/entry.tsx')], outdir: output,
  target: 'browser', format: 'esm', splitting: true, minify: true,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
});
if (!result.success) throw new AggregateError(result.logs, 'G2 bundle failed');
async function run(args: string[]) {
  const proc = Bun.spawn(args, { cwd: root, stdout: 'inherit', stderr: 'inherit' });
  if (await proc.exited !== 0) throw new Error(`G2 packaging command failed: ${args[0]}`);
}
await run(['bunx', 'tailwindcss', '-i', 'src/styles.css', '-o', 'g2/dist/app.css', '--minify']);
await appendFile(resolve(output, 'app.css'), await readFile(resolve(root, 'g2/font.css')));
for (const weight of [400, 700]) {
  await copyFile(resolve(root, `node_modules/@fontsource/dm-sans/files/dm-sans-latin-${weight}-normal.woff2`), resolve(output, `dm-sans-${weight}.woff2`));
}
await copyFile(resolve(root, 'g2/shell.html'), resolve(output, 'index.html'));
await copyFile(resolve(root, 'public/favicon.png'), resolve(output, 'logo.png'));
// Explicit allowlist: no server files, environment files, or source maps in the package.
for (const entry of await readdir(output)) {
  if (!/^(index\.html|logo\.png|app\.css|dm-sans-(400|700)\.woff2|[\w.-]+\.js)$/.test(entry)) throw new Error(`Unexpected package entry: ${entry}`);
}
await mkdir(resolve(root, 'public/downloads'), { recursive: true });
await run(['bunx', 'evenhub', 'pack', 'g2/app.json', 'g2/dist', '--sdk-ver', '0.0.16', '-o', 'public/downloads/byyourside-g2.ehpk']);
await copyFile(resolve(root, 'docs/g2-hardware.md'), resolve(root, 'public/downloads/g2-setup.md'));
console.log('G2 package ready: public/downloads/byyourside-g2.ehpk');
