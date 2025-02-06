import { build } from '@sagebrush/alexandria';
import { join } from 'path';
import glob from 'glob';
import { readFileSync } from 'fs';

const rootDir = process.cwd();

build({
  outDir: join(rootDir, 'out'),
  layouts: glob.sync('**/*.mdx', { cwd: join(rootDir, 'layouts'), realpath: true }),
  articles: glob.sync('**/*.mdx', { cwd: join(rootDir, 'articles'), realpath: true }),
  componentsDir: join(rootDir, 'components'),
  publicDir: join(rootDir, 'public'),
  template: readFileSync(join(rootDir, 'template.html'), 'utf-8'),
}).catch(console.error);
