import {build as esBuild} from 'esbuild'
import cleanBundledDependencies from '../../../bin/clean-bundled-dependencies.js'

const external =[
  '@shopify/cli-kit',
  'react-devtools-core', // react-devtools-core can't be bundled (part of ink)
  'yoga-wasm-web',  // yoga-wasm-web can't be bundled (part of ink)
  'react', // Excluded because we can't have two reacts (app and cli-kit  )
  '@shopify/plugin-cloudflare', // Plugins need to be external so that they can be loaded dynamically
  'esbuild', // esbuild can't be bundled
  'javy-cli' // This needs to be external so that we can invoke it with `npm exec -- javy`
  '@luckycatfactory/esbuild-graphql-loader', // esbuild plugin, can't be bundled
]

await esBuild({
  bundle: true,
  entryPoints: ['./src/**/*.ts'],
  outdir: './dist/cli',
  platform: 'node',
  format: 'esm',
  inject: ['../../bin/cjs-shims.js'],
  external,
  loader: {'.node': 'copy'},
  splitting: true,
  plugins: [],
})

await cleanBundledDependencies(external)
