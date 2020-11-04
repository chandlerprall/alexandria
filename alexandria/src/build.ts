import {createElement, ComponentType, useContext} from 'react';
import { transform } from '@babel/core';
import { readFile, writeFile, mkdir } from 'fs';
import { extname, join, dirname, basename, relative } from 'path';
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
import webpack from 'webpack';
// @ts-ignore
import nodeExternals from 'webpack-node-externals';
import {ComponentMap, renderArticle} from "./render_article";
import {ArticleMetadata, ArticlesMetadata} from './types'
import {AlexandriaContext} from "./context";

const asyncMkdir = promisify(mkdir);
const asyncReadFile = promisify(readFile);
const asyncWriteFile = promisify(writeFile);

interface BuildConfig {
    outDir: string;
    layouts: string[];
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

const babelConfig = {
    babelrc: false,
    presets: [
        '@babel/preset-typescript',
        '@babel/preset-env',
        '@babel/preset-react',
    ],
};

export const build = async (config: BuildConfig) => {
    const { outDir, layouts, articles, components } = config;
    const articlesOutDir = join(outDir, 'articles');

    await asyncMkdir(articlesOutDir, { recursive: true });
    const layoutResults = await processLayouts(layouts);
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
        layoutResults,
        articleResults,
        components,
        articlesMetadata,
    });
};

function processLayouts(layoutPaths: string[]) {
    const layoutPromises: Array<Promise<ArticleResult>> = [];

    for (let i = 0; i < layoutPaths.length; i++) {
        layoutPromises.push(processArticle(layoutPaths[i]));
    }

    return Promise.all(layoutPromises);
}

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

    const hash = xxhash.hash64(Buffer.from(articleContents), 0xDEADDEAD).toString('hex');

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
    layoutResults: ArticleResult[];
    articleResults: ArticleResult[];
    articlesMetadata: ArticlesMetadata;
    components: ComponentMap;
}
function findLayout(layoutResults: ArticleResult[], layoutName: string) {
    const layoutFilename = `${layoutName}.mdx`;
    return layoutResults.find(result => {
        return basename(result.articlePath) === layoutFilename;
    });
}
async function writeApplication(config: WriteApplicationConfig) {
    const { outDir, layoutResults, articleResults, components, articlesMetadata } = config;

    const allDynamics: { [key: string]: any } = {};
    await asyncMkdir(join(outDir, 'layouts'), { recursive: true });
    for (let i = 0; i < layoutResults.length; i++) {
        const layoutResult = layoutResults[i];
        if (layoutResult.success === false) continue;

        const transformedLayoutCode = transform(
            layoutResult.jsxContents,
            {
                ...babelConfig,
                filename: layoutResult.articlePath
            }
        );

        await asyncWriteFile(
            join(outDir, 'layouts', `${layoutResult.hash}.js`),
            transformedLayoutCode!.code!
        );
    }

    for (let i = 0; i < articleResults.length; i++) {
        const articleResult = articleResults[i];
        if (articleResult.success === false) continue;

        const transformedArticleCode = transform(
            articleResult.jsxContents,
            {
                ...babelConfig,
                filename: articleResult.articlePath
            }
        );

        await asyncWriteFile(
            join(outDir, 'articles', `${articleResult.hash}.js`),
            transformedArticleCode!.code!
        );

        const realizedComponents: ComponentMap = {};
        const componentKeys = Object.keys(components);
        for (let i = 0; i < componentKeys.length; i++) {
            const key = componentKeys[i];
            const component = components[key];
            if (typeof component === 'string') {
                realizedComponents[key] = await transformComponent(outDir, key, component);
            } else {
                realizedComponents[key] = component;
            }
        }

        const layoutName = articleResult.meta.layout;
        const layout = (findLayout(layoutResults, layoutName) || findLayout(layoutResults, 'main')) as ArticleResultSuccess;

        const articleDynamics = await renderArticle({
            outDir,
            layout,
            article: articleResult,
            components: realizedComponents,
            articlesMetadata,
        });
        Object.assign(allDynamics, articleDynamics);
    }

    await asyncWriteFile(
        join(outDir, 'app.js'),
        `
import React from 'react';
import ReactDOM, { useRef, createPortal } from 'react-dom';

const container = document.createElement('div');

const dynamics = ${JSON.stringify(allDynamics)};

const App = () => {
    const portals = [];
    const components = {
${
            Object.keys(allDynamics).map(key => `${allDynamics[key].name}: require('${allDynamics[key].name}').default`)
}
    };
    
    const dynamicsKeys = Object.keys(dynamics);
    for (let i = 0; i < dynamicsKeys.length; i++) {
        const key = dynamicsKeys[i];
        const dynamic = dynamics[key];
        const { name, props } = dynamic;
        
        const Component = components[name];
        const element = document.getElementById(key);
        element.innerHTML = '';
        portals.push(createPortal(<Component {...props}/>, element));
    }
    
    return <>{portals}</>
};

ReactDOM.render(
    <App/>,
    container
);
        `
    );

    const aliases: any = {};
    const dynamicsKeys = Object.keys(allDynamics);
    for (let i = 0; i < dynamicsKeys.length; i++) {
        const key = dynamicsKeys[i];
        const dynamic = allDynamics[key];
        aliases[dynamic.name] = dynamic.componentPath;
    }

    webpack(
        {
            mode: 'development',

            context: outDir,
            entry: './app.js',

            output: {
                path: join(outDir, 'build'),
                filename: 'app.js'
            },

            resolve: {
                alias: aliases,
                fallback: {
                    path: false,
                }
            },

            module: {
                rules: [
                    {
                        test: /\.(js|ts|tsx)$/,
                        exclude: /node_modules/,
                        loader: 'babel-loader',
                        options: babelConfig,
                    }
                ]
            }
        },
        (err, stats) => {
            if (err) {
                console.error(err);
            } else {
                if (stats!.hasErrors()) {
                    const info = stats!.toJson();
                    console.error(info.errors);
                } else {
                    console.log('build complete');
                }
            }
        }
    )
}

let nextDynamicsId = 0;
async function transformComponent(outDir: string, name: string, componentPath: string): Promise<ComponentType<any>> {
    const sourceDir = dirname(componentPath);
    const filename = basename(componentPath);
    const targetDir = join(outDir, 'dynamics', basename(componentPath, extname(filename)));
    return new Promise((resolve, reject) => {
        webpack({
            mode: 'development',

            context: sourceDir,
            entry: './' + relative(sourceDir, componentPath),

            output: {
                libraryTarget: 'commonjs2',
                path: targetDir,
                filename: 'index.js',
            },

            target: 'node',
            externals: [nodeExternals()],

            module: {
                rules: [
                    {
                        test: /\.(js|ts|tsx)$/,
                        exclude: /node_modules/,
                        loader: 'babel-loader',
                        options: babelConfig,
                    }
                ]
            }
        }, (err, stats) => {
            if (err) {
                reject(err);
            } else {
                if (stats!.hasErrors()) {
                    const info = stats!.toJson();
                    console.error(info.errors);
                }

                const Component = require(join(targetDir, 'index.js')).default;
                resolve(({children, ..._props}: any) => {
                    const {dynamicsReport} = useContext(AlexandriaContext);
                    const props = JSON.parse(JSON.stringify(_props));
                    const id = `dynamic-${nextDynamicsId++}`;
                    dynamicsReport(id, name, props, componentPath);

                    return createElement(
                        'div',
                        {id},
                        createElement(Component, props)
                    );
                })
            }
        });
    });
}