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
    articlesMetadata: ArticlesMetadata
    dynamicsReport: (id: string, definition: Object) => void
}