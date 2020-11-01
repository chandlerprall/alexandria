import { writeFile, mkdir } from 'fs';
import { promisify } from 'util';
import { ComponentType } from 'react';
// @ts-ignore
import { mdx, MDXProvider } from '@mdx-js/react';
import ReactDOM  from 'react-dom/server';
import { join, dirname } from 'path';
import {ArticleResultSuccess} from "./build";

const asyncWriteFile = promisify(writeFile);
const asyncMkdir = promisify(mkdir);

export interface ComponentMap {
    [name: string]: ComponentType<any>;
}

// @ts-ignore
import jsdom from 'jsdom';
const dom = new jsdom.JSDOM();
// @ts-ignore
global.window = dom.window;
// @ts-ignore
global.document = dom.window.document;
// @ts-ignore
global.navigator = dom.window.navigator;
// @ts-ignore
global.Element = dom.window.Element;

interface RenderArticleConfig {
    outDir: string;
    article: ArticleResultSuccess;
    components: ComponentMap;
}
export async function renderArticle(config: RenderArticleConfig) {
    const { outDir, article, components } = config;

    const Component = require(join(outDir, 'articles', `${article.hash}.js`)).default;
    const articleHtml = ReactDOM.renderToStaticMarkup(
        mdx(
            MDXProvider,
            {
                components,
                children: mdx(Component),
            },
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
}