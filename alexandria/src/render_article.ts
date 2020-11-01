import { writeFile, mkdir } from 'fs';
import { promisify } from 'util';
import React from 'react';
import ReactDOM  from 'react-dom/server';
import { join, dirname } from 'path';
import {ArticleResultSuccess} from "./build";

const asyncWriteFile = promisify(writeFile);
const asyncMkdir = promisify(mkdir);

interface RenderArticleConfig {
    outDir: string;
    article: ArticleResultSuccess;
}
export async function renderArticle(config: RenderArticleConfig) {
    const { outDir, article } = config;

    const Component = require(join(outDir, 'articles', `${article.hash}.js`)).default;
    const articleHtml = ReactDOM.renderToStaticMarkup(React.createElement(Component));

    const withLayoutHtml = `
<!DOCTYPE html>
<html>
    <head>
        <title>${article.meta.title}</title>
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