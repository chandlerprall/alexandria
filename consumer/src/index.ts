import { build } from 'alexandria';
import { join } from 'path';
import * as glob from 'glob';

build({
    outDir: join(__dirname, '..', 'out'),
    articles: glob.sync('**', { cwd: join(__dirname, '..', 'articles'), realpath: true }),
});
