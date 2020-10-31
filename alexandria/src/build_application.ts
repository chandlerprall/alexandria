import { join } from 'path';
import webpack from 'webpack';

export interface BuildApplicationConfig {
    outDir: string;
}
export async function buildApplication(config: BuildApplicationConfig) {
    webpack({
        mode: 'development',

        context: config.outDir,
        entry: './index.js',

        output: {
            path: join(config.outDir, 'build'),
            filename: 'build.js'
        },

        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modues/,
                    loader: 'babel-loader',
                    options: {
                        babelrc: false,
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react',
                        ]
                    }
                }
            ]
        }
    }, (error, stats) => {
        if (error) {
            console.error(error);
        } else {
            console.log(stats);
        }
    });
}
