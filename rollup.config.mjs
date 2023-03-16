import typescript from '@rollup/plugin-typescript';
import progress from 'rollup-plugin-progress';
import { visualizer } from 'rollup-plugin-visualizer';
import cleaner from 'rollup-plugin-cleaner';

const inspect = process.env.BUILD_STATS;

export default {
    input: 'src/index.ts',
    output: {
        dir: 'dist',
        format: 'cjs',
        sourcemap: true,
    },
    plugins: [
        cleaner({
            targets: ['./dist'],
        }),
        typescript(),
        progress({
            clearLine: false,
        }),
        ...(!!inspect
            ? [
                  visualizer({
                      emitFile: true,
                      filename: 'stats/index.html',
                  }),
              ]
            : []),
    ],
};
