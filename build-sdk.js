import { build } from 'esbuild';

build({
  entryPoints: ['node_modules/retell-client-js-sdk/dist/index.js'],
  bundle: true,
  format: 'iife',
  globalName: 'RetellSDK',
  outfile: 'retell-sdk-bundle.js',
  platform: 'browser',
  target: 'es2020'
}).then(() => {
  console.log('✓ SDK bundle creato: retell-sdk-bundle.js');
}).catch((err) => {
  console.error('Errore:', err);
  process.exit(1);
});