import esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['index.js'],
  outfile: 'outfile.cjs',
  bundle: true,
  format: 'cjs',
  platform: 'node',
  target: 'node14',
})