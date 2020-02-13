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

  external: ['idb', 'lit-html', 'lit-html/directives/class-map', 'lit-html/directives/until'],

  output: {
    file: path.resolve(__dirname, 'dist', `${pkg.name}.user.js`),
    format: 'iife',
    banner: isDevelopment && generateBanner(),
    globals: {
      idb: 'idb',
      'lit-html': 'litHtml',
      'lit-html/directives/class-map': 'litHtml',
      'lit-html/directives/until': 'litHtml',
    },
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

/**
 * @param {string} filename Nome do arquivo sem extensão
 * @param {string} umdName Nome da variável UMD
 * @return {import('rollup').RollupOptions}
 */
const configModulos = (filename, umdName) => ({
  input: path.resolve(__dirname, 'src', `${filename}.mjs`),
  output: {
    file: path.resolve(__dirname, 'dist', `${filename}.umd.js`),
    format: 'umd',
    name: umdName,
  },
  plugins: [resolve(), terser({ ecma: 8, output: { comments: false } })],
});

export default [config, configModulos('lit-html', 'litHtml'), configModulos('idb', 'idb')];
