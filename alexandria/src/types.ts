import { ComponentType } from 'react';

export interface ArticleMetadata {
    id: string;
    slug: string;
    title: string;
    [key: string]: string;
}

export interface ArticlesMetadata {
    [id: string]: ArticleMetadata
}

export interface AlexandriaContextShape {
    componentMapToPath: Map<ComponentType, string>;
    articlesMetadata: ArticlesMetadata;
    dynamicsReport: (id: string, definition: Object) => void;
}