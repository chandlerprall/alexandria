import './polyfill';
import { build } from 'alexandria';
import { join } from 'path';
import * as glob from 'glob';

build({
    outDir: join(__dirname, '..', 'out'),
    layouts: glob.sync('**/*.mdx', { cwd: join(__dirname, '..', 'layouts'), realpath: true }),
    articles: glob.sync('**/*.mdx', { cwd: join(__dirname, '..', 'articles'), realpath: true }),
    componentsDir: join(__dirname, '..', 'components'),
}).catch(console.error);
