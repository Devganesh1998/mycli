import typescript from '@rollup/plugin-typescript';
import progress from 'rollup-plugin-progress';
import { visualizer } from 'rollup-plugin-visualizer';
import eslint from '@rollup/plugin-eslint';
import cleaner from 'rollup-plugin-cleaner';

// eslint-disable-next-line no-undef
const inspect = process.env.BUILD_STATS;

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
    },
    plugins: [
        eslint({
            throwOnError: true,
        }),
        cleaner({
            targets: ['./dist'],
        }),
        typescript(),
        progress({
            clearLine: false,
        }),
        ...(inspect
            ? [
                  visualizer({
                      emitFile: true,
                      filename: 'stats/index.html',
                  }),
              ]
            : []),
    ],
};
