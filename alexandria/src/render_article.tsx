import { writeFile, mkdir } from 'fs'
import { promisify } from 'util';
import React, { ComponentType } from 'react';
import { CacheProvider as EmotionCacheProvider } from '@emotion/react';
import createEmotionServer from '@emotion/server/create-instance';
import createCache from '@emotion/cache';
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

    const key = 'cachekey';
    const cache = createCache({ key });
    const { extractCritical } = createEmotionServer(cache);

    const { html, css, ids } = extractCritical(ReactDOM.renderToStaticMarkup(
        <AlexandriaContext.Provider value={ context }>
            <EmotionCacheProvider value={cache}>
                {mdx(
                    MDXProvider,
                    {
                        components: {
                            ...components,
                            Article: Component,
                            Style: (props) => <Helmet>
                                <style {...props} />
                            </Helmet>,
                            Link: (props) => <Helmet>
                                <link {...props} />
                            </Helmet>,
                        },
                    },
                    mdx(Layout)
                )}
            </EmotionCacheProvider>
        </AlexandriaContext.Provider>
    ));
    const helmet = Helmet.renderStatic();

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
        <style data-emotion="${key} ${ids.join(' ')}">${css}</style>
    </head>
    <body>
        ${html}
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