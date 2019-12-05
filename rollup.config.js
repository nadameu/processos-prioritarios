/* eslint-disable @typescript-eslint/camelcase */
import path from 'path';
import serve from 'rollup-plugin-serve';
import typescript from 'rollup-plugin-typescript';
import pkg from './package.json';
import resolve from 'rollup-plugin-node-resolve';
// import string from 'rollup-plugin-string';
import postcss from 'rollup-plugin-postcss';
import { generateBanner } from './generateBanner.js';
import { terser } from 'rollup-plugin-terser';

/** @type {import('rollup').RollupOptions} */
const config = {
  input: path.resolve(__dirname, 'src', 'index.ts'),

  output: {
    file: path.resolve(__dirname, 'dist', `${pkg.name}.user.js`),
    format: 'es',
  },

  plugins: [
    typescript(),
    resolve(),
    postcss(),
    process.env.BUILD === 'production' &&
      terser({
        ecma: 8,
        module: true,
        toplevel: true,
        compress: {
          passes: 5,
          sequences: false,
          unsafe: true,
          unsafe_arrows: true,
          unsafe_methods: true,
        },
        mangle: false,
        output: {
          beautify: true,
          preamble: generateBanner(),
        },
      }),
    process.env.BUILD === 'development' &&
      serve({ contentBase: 'dist', open: true, openPage: `/${pkg.name}.user.js` }),
  ],
};

export default config;
