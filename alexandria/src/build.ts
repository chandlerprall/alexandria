import { transform } from '@babel/core';
import { readFile, writeFile, mkdir } from 'fs';
import { extname, join } from 'path';
import { promisify } from 'util';
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
import {ComponentMap, renderArticle} from "./render_article";
import {ArticleMetadata, ArticlesMetadata} from './types'

const asyncMkdir = promisify(mkdir);
const asyncReadFile = promisify(readFile);
const asyncWriteFile = promisify(writeFile);

interface BuildConfig {
    outDir: string;
    articles: string[];
    components: ComponentMap;
}

export interface ArticleResultSuccess {
    articlePath: string;
    success: true;
    hash: string;
    rawSource: string;
    meta: ArticleMetadata;
    jsxContents: string;
}
export interface ArticleResultError {
    articlePath: string;
    success: false;
    error: Error;
}
export type ArticleResult = ArticleResultSuccess | ArticleResultError;

export const build = async (config: BuildConfig) => {
    const { outDir, articles, components } = config;
    const articlesOutDir = join(outDir, 'articles');

    await asyncMkdir(articlesOutDir, { recursive: true });
    const articleResults = await processArticles(articles);
    const articlesMetadata: ArticlesMetadata = {};

    for (let i = 0; i < articleResults.length; i++) {
        const articleResult = articleResults[i];

        if (articleResult.success === false) {
            console.error(articleResult.error);
        } else {
            articlesMetadata[articleResult.meta.id] = articleResult.meta;
        }
    }

    await writeApplication({
        outDir,
        articleResults,
        components,
        articlesMetadata,
    });
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

    const hash = xxhash.hash64(Buffer.from(articleContents), 0xDEADDEAD).toString('base64');

    return {
        articlePath,
        success: true,
        hash,
        rawSource: articleContents,
        meta: result.data.frontmatter,
        jsxContents: `/* @jsxRuntime classic */\n/* @jsx mdx */\nimport { mdx } from '@mdx-js/react';\n${result.contents}`,
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
    articleResults: ArticleResult[];
    articlesMetadata: ArticlesMetadata;
    components: ComponentMap;
}
async function writeApplication(config: WriteApplicationConfig) {
    const { outDir, articleResults, components, articlesMetadata } = config;

    for (let i = 0; i < articleResults.length; i++) {
        const articleResult = articleResults[i];
        if (articleResult.success === false) continue;

        const transformedArticleCode = transform(
            articleResult.jsxContents,
            {
                babelrc: false,
                presets: [
                    '@babel/preset-env',
                    '@babel/preset-react',
                ]
            }
        );

        await asyncWriteFile(
            join(outDir, 'articles', `${articleResult.hash}.js`),
            transformedArticleCode!.code!
        );

        renderArticle({
            outDir,
            article: articleResult,
            components,
            articlesMetadata,
        });
    }
}
