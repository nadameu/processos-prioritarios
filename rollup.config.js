import typescript from 'rollup-plugin-typescript';
import path from 'path';
import pkg from './package.json';

export default {
  input: 'src/index.ts',

  output: {
    file: path.resolve(__dirname, 'dist', `${pkg.name}.user.js`),
    format: 'es'
  },

  plugins: [typescript()]
};
