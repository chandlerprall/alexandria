import { writeFile, mkdir } from 'fs';
import { promisify } from 'util';
import { ComponentType } from 'react';
// @ts-ignore
import { mdx, MDXProvider } from '@mdx-js/react';
import ReactDOM  from 'react-dom/server';
import { join, dirname } from 'path';
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
}
export async function renderArticle(config: RenderArticleConfig) {
    const { outDir, layout, article, components, articlesMetadata, componentMapToPath } = config;

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
                    },
                    children: mdx(Layout),
                },
            )
        )
    );

    const withLayoutHtml = `
<!DOCTYPE html>
<html>
    <head>
        <title>${article.meta.title}</title>
        <link rel="stylesheet" type="text/css" href="/eui_theme_light.css"/>
    </head>
    <body>
        ${articleHtml}
        <script type="text/javascript" src="/app.js"></script>
    </body>
</html>
    `;

    const articleHtmlPath = join(outDir, 'build', `${article.meta.slug}.html`)
    const articleHtmlDir = dirname(articleHtmlPath);
    await asyncMkdir(articleHtmlDir, { recursive: true });
    await asyncWriteFile(
        articleHtmlPath,
        withLayoutHtml
    );

    return dynamics;
}