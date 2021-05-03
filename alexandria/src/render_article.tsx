import { writeFile, mkdir } from 'fs'
import { promisify } from 'util';
import React, { ComponentType } from 'react';
// @ts-ignore
import { mdx, MDXProvider } from '@mdx-js/react';
import ReactDOM  from 'react-dom/server';
import { join, dirname } from 'path';
import Helmet from 'react-helmet';
import {ArticleResultSuccess} from "./build";
import {AlexandriaContext} from './context';
import {AlexandriaContextShape, ArticlesMetadata} from './types';

const asyncWriteFile = promisify(writeFile);
const asyncMkdir = promisify(mkdir);

export interface ComponentMap {
    [name: string]: ComponentType<any>;
}

interface RenderArticleConfig {
    outDir: string;
    layout: ArticleResultSuccess;
    article: ArticleResultSuccess;
    articlesMetadata: ArticlesMetadata;
    components: ComponentMap;
    componentMapToPath: Map<ComponentType, string>;
    template: string;
}
export async function renderArticle(config: RenderArticleConfig) {
    const { outDir, layout, article, components, articlesMetadata, componentMapToPath, template } = config;

    const dynamics: { [id: string]: any } = {};
    const context: AlexandriaContextShape = {
        componentMapToPath,
        articlesMetadata,
        dynamicsReport: (id, definition: Object) => {
            dynamics[id] = definition;
        }
    }

    const Layout = require(join(outDir, 'layouts', `${layout.hash}.js`)).default;
    const Component = require(join(outDir, 'articles', `${article.hash}.js`)).default;

    const articleHtml = ReactDOM.renderToStaticMarkup(
        mdx(
            AlexandriaContext.Provider,
            { value: context },
            mdx(
                MDXProvider,
                {
                    components: {
                        ...components,
                        Article: Component,
                        Style: (props) => <Helmet><style {...props} /></Helmet>,
                        Link: (props) => <Helmet><link {...props} /></Helmet>,
                    },
                },
                mdx(Layout)
            )
        )
    );
    const helmet = Helmet.renderStatic();

    /*
    const withLayoutHtml = template
      .replace('${title}', article.meta.title)
      .replace('${article}', articleHtml);
    */
    const withLayoutHtml = `
<!DOCTYPE html>
<html>
    <head>
        <title>${article.meta.title}</title>
        ${helmet.meta.toString()}
        ${helmet.link.toString()}
        ${helmet.noscript.toString()}
        ${helmet.script.toString()}
        ${helmet.style.toString()}
    </head>
    <body>
        ${articleHtml}
        <script type="text/javascript" src="/app.js"></script>
    </body>
</html>
    `;

    const articleHtmlPath = join(outDir, 'build', article.meta.slug, 'index.html');
    const articleHtmlDir = dirname(articleHtmlPath);
    await asyncMkdir(articleHtmlDir, { recursive: true });
    await asyncWriteFile(
        articleHtmlPath,
        withLayoutHtml
    );

    return dynamics;
}