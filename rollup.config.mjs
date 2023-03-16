import typescript from '@rollup/plugin-typescript';
import progress from 'rollup-plugin-progress';
import { visualizer } from 'rollup-plugin-visualizer';
import eslint from '@rollup/plugin-eslint';
import cleaner from 'rollup-plugin-cleaner';
import json from '@rollup/plugin-json';

// eslint-disable-next-line no-undef
const inspect = process.env.BUILD_STATS;
// eslint-disable-next-line no-undef
const isDev = process.env.NODE_ENV === 'development';

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
        // Need this for CLI
        banner: '#!/usr/bin/env node',
    },
    ...(isDev
        ? {
              watch: {
                  include: 'src/**',
              },
          }
        : {}),
    plugins: [
        eslint({
            throwOnError: true,
        }),
        cleaner({
            targets: ['./dist'],
        }),
        typescript(),
        json(),
        progress({
            clearLine: false,
        }),
        ...(inspect && !isDev
            ? [
                  visualizer({
                      emitFile: true,
                      filename: 'stats/index.html',
                  }),
              ]
            : []),
    ],
};
