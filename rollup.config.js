/* eslint-disable @typescript-eslint/camelcase */

import path from 'path';
import resolve from 'rollup-plugin-node-resolve';
import postcss from 'rollup-plugin-postcss';
import prettier from 'rollup-plugin-prettier';
import serve from 'rollup-plugin-serve';
import { string } from 'rollup-plugin-string';
import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript';
import { generateBanner } from './generateBanner.js';
import pkg from './package.json';

const isDevelopment = process.env.BUILD === 'development';
const isProduction = process.env.BUILD === 'production';

/** @type {import('rollup').RollupOptions} */
const config = {
  input: path.resolve(__dirname, 'src', 'index.ts'),

  external: ['preact'],

  output: {
    file: path.resolve(__dirname, 'dist', `${pkg.name}.user.js`),
    format: 'iife',
    banner: isDevelopment && generateBanner(),
    globals: { preact: 'preact' },
  },

  plugins: [
    typescript(),
    resolve(),
    string({ include: '*.svg' }),
    postcss(),
    isProduction &&
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
          preamble: generateBanner(),
        },
      }),
    prettier(),
    isDevelopment && serve({ contentBase: 'dist', open: true, openPage: `/${pkg.name}.user.js` }),
  ],
};

export default config;
