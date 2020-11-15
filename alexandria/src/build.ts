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
import {ComponentMap, renderArticle} from './render_article';
import {ArticleMetadata, ArticlesMetadata} from './types'
import {AlexandriaContext} from "./context";
import { Dynamic } from './dynamic';
import * as glob from 'glob';

const asyncMkdir = promisify(mkdir);
const asyncReadFile = promisify(readFile);
const asyncWriteFile = promisify(writeFile);

interface BuildConfig {
    outDir: string;
    layouts: string[];
    articles: string[];
    componentsDir: string;
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
    const { outDir, layouts, articles, componentsDir } = config;

    // transpile components
    const componentsOutDir = join(outDir, 'components');
    await asyncMkdir(componentsOutDir, { recursive: true });
    const {pathedComponents, realizedComponents} = await processComponents(componentsDir, componentsOutDir);

    // build articles
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
        components: pathedComponents,
        componentMap: realizedComponents,
        articlesMetadata,
    });
};

async function processComponents(componentsSourceDir: string, componentsOutDir: string) {
    const realizedComponents: ComponentMap = {};
    const pathedComponents: { [name: string]: string } = {};

    const componentPaths = glob.sync('**/*.tsx', { cwd: componentsSourceDir, realpath: true });

    for (let i = 0; i < componentPaths.length; i++) {
        const componentPath = componentPaths[i];
        const extension = extname(componentPath);
        const componentBaseName = basename(componentPath, extension);
        const componentRelativePath = dirname(relative(componentsSourceDir, componentPath));
        const componentOutDir = join(componentsOutDir, componentRelativePath);
        const componentOutPath = join(componentOutDir, `${componentBaseName}.js`);

        const componentSource = (await asyncReadFile(componentPath)).toString();
        const transformedCode = transform(
          componentSource,
          {
              ...babelConfig,
              filename: componentPath,
          }
        );

        await asyncMkdir(componentOutDir, { recursive: true });

        await asyncWriteFile(
          componentOutPath,
          transformedCode!.code!
        );

        realizedComponents[componentBaseName] = require(componentOutPath).default;
        pathedComponents[componentBaseName] = componentOutPath;
    }

    return { pathedComponents, realizedComponents };
}

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
    components: { [name: string]: string };
    componentMap: ComponentMap;
}
function findLayout(layoutResults: ArticleResult[], layoutName: string) {
    const layoutFilename = `${layoutName}.mdx`;
    return layoutResults.find(result => {
        return basename(result.articlePath) === layoutFilename;
    });
}
async function writeApplication(config: WriteApplicationConfig) {
    const { outDir, layoutResults, articleResults, components, componentMap, articlesMetadata } = config;

    const componentMapToPath = new Map<ComponentType, string>();
    const availableComponents = Object.keys(components);
    for (let i = 0; i < availableComponents.length; i++) {
        const componentName = availableComponents[i];
        componentMapToPath.set(componentMap[componentName], componentName);
    }

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

        const layoutName = articleResult.meta.layout;
        const layout = (findLayout(layoutResults, layoutName) || findLayout(layoutResults, 'main')) as ArticleResultSuccess;

        const articleDynamics = await renderArticle({
            outDir,
            layout,
            article: articleResult,
            components: {
                ...componentMap,
                Dynamic,
            },
            articlesMetadata,
            componentMapToPath,
        });
        Object.assign(allDynamics, articleDynamics);
    }

    function getUsedComponents(definition: any, usedComponents: Set<string>) {
        if (Array.isArray(definition)) {
            for (let i = 0; i < definition.length; i++) {
                getUsedComponents(definition[i], usedComponents);
            }
        } else {
            if (components.hasOwnProperty(definition.component)) {
                usedComponents.add(definition.component);
            }
            if (definition.props?.children) getUsedComponents(definition.props.children, usedComponents);
        }
    }

    const usedComponents = Array.from(
      Object.keys(allDynamics).reduce(
          (usedComponents, dynamicsName) => {
              const definition = allDynamics[dynamicsName];
              getUsedComponents(definition, usedComponents);
              return usedComponents;
          },
          new Set<string>()
        )
    );

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
            usedComponents.map(key => `'${key}': require('${key}').default`)
}
    };
    
    function hydrateComponent(definition, key) {
        if (definition == null) return null;
        
        if (Array.isArray(definition)) {
        	return (
        		<>
        		    {definition.map(hydrateComponent)}
        		</>
        	);
        }
        
        if (typeof definition === 'string') return definition;
        
        const { component, props: { children, ...props } = {} } = definition;
        const Component = components[component] || component;
        
        props.key = key;
        
        return <Component {...props}>{hydrateComponent(children)}</Component>;
    }
    
    const dynamicsKeys = Object.keys(dynamics);
    for (let i = 0; i < dynamicsKeys.length; i++) {
        const key = dynamicsKeys[i];
        const element = document.getElementById(key);
        if (element == null) continue;
        const definition = dynamics[key];
        
        element.innerHTML = '';
        portals.push(createPortal(hydrateComponent(definition), element));
    }
    
    return <>{portals}</>
};

ReactDOM.render(
    <App/>,
    container
);
        `
    );

    const aliases = usedComponents.reduce<any>(
      (aliases, componentName) => {
          aliases[componentName] = components[componentName];
          return aliases;
      },
      {}
    );

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
