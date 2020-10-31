import { readFile, writeFile, mkdir } from 'fs';
import { extname, join } from 'path';
import { promisify } from 'util';
import glob from 'glob';
import detectFrontmatter from 'remark-frontmatter';
import vfile from 'vfile';
import visit from 'unist-util-visit';
import * as yaml from 'yaml';
// @ts-ignore
import { createCompiler } from '@mdx-js/mdx';
// @ts-ignore
import remove from 'unist-util-remove';
// @ts-ignore
import xxhash from 'xxhash';
import {buildApplication} from "./build_application";

const asyncMkdir = promisify(mkdir);
const asyncReadFile = promisify(readFile);
const asyncWriteFile = promisify(writeFile);
const asyncGlob = promisify(glob);

interface BuildConfig {
    outDir: string;
    articles: string[];
}

interface ArticleResultSuccess {
    articlePath: string;
    success: true;
    rawSource: string;
    meta: ArticleMetadata;
    jsxContents: string;
}
interface ArticleResultError {
    articlePath: string;
    success: false;
    error: Error;
}
type ArticleResult = ArticleResultSuccess | ArticleResultError;

interface Route {
    id: string;
    slug: string;
    articleFile: string;
}

export const build = async (config: BuildConfig) => {
    const { outDir, articles } = config;
    const articlesOutDir = join(outDir, 'articles');

    await asyncMkdir(articlesOutDir, { recursive: true });
    const articleResults = await processArticles(articles);
    const routes: Route[] = [];

    for (let i = 0; i < articleResults.length; i++) {
        const articleResult = articleResults[i];

        if (articleResult.success) {
            const hash = xxhash.hash64(Buffer.from(articleResult.rawSource), 0xDEADDEAD).toString('base64');
            const outPath = join(articlesOutDir, `${hash}.js`);
            asyncWriteFile(outPath, articleResult.jsxContents);

            routes.push({
                id: articleResult.meta.id,
                slug: articleResult.meta.slug,
                articleFile: `${hash}.js`
            });
        } else {
            console.error(articleResult.error);
        }
    }

    await writeApplication({
        outDir,
        routes,
    });

    await buildApplication({ outDir });
};

function processArticles(articlesPaths: string[]) {
    const articlePromises: Array<Promise<ArticleResult>> = [];

    for (let i = 0; i < articlesPaths.length; i++) {
        articlePromises.push(processArticle(articlesPaths[i]));
    }

    return Promise.all(articlePromises);
}

async function processArticle(articlePath: string): Promise<ArticleResult> {
    try {
        const articleExtension = extname(articlePath);
        const fileContentsBuffer = await asyncReadFile(articlePath);

        if (articleExtension === '.mdx') {
            return processMdxArticle(articlePath, fileContentsBuffer.toString());
        } else {
            throw new Error(`Unable to handle article ${articlePath}: extension not recognized`);
        }
    } catch (error) {
        return {
            articlePath,
            success: false,
            error,
        };
    }
}

const mdxCompiler = createCompiler({
    remarkPlugins: [[detectFrontmatter, 'yaml'], extractFrontmatter]
})

interface ArticleMetadata {
    id: string;
    slug: string;
    title: string;
}

interface MdxFileResults {
    data: {
        frontmatter: ArticleMetadata;
    };
    contents: string;
}
async function processMdxArticle(articlePath: string, articleContents: string): Promise<ArticleResult> {
    const result = await new Promise<MdxFileResults>((resolve, reject) => {
        mdxCompiler.process(vfile(articleContents), function done(err: Error, file: typeof vfile) {
            if (err) reject(err);
            resolve(file as MdxFileResults);
        })
    });

    return {
        articlePath,
        success: true,
        rawSource: articleContents,
        meta: result.data.frontmatter,
        jsxContents: `/* @jsx mdx */\nimport { mdx } from '@mdx-js/react';\n${result.contents}`,
    };
}

function extractFrontmatter() {
    return function transformer(tree: any, file: any) {
        visit(tree, 'yaml', function visitor(node: any) {
            file.data.frontmatter = yaml.parse(node.value)
        })
        remove(tree, 'yaml')
    }
}

interface WriteApplicationConfig {
    outDir: string;
    routes: Route[];
}
async function writeApplication(config: WriteApplicationConfig) {
    const { outDir, routes } = config;

    const templateDir = join(__dirname, '..', 'application_template');
    const templateFiles = await asyncGlob('**/*', { cwd: templateDir });

    for (let i = 0; i < templateFiles.length; i++) {
        const templateFile = templateFiles[i];
        const templateFileSource = (await asyncReadFile(join(templateDir, templateFile))).toString();
        const realizedTemplate = templateFileSource
            .replace(/{{routes}}/g, JSON.stringify(routes));
        await asyncWriteFile(join(outDir, templateFile), realizedTemplate);
    }
}
