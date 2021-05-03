import { useContext } from 'react';
import { AlexandriaContext, ArticleMetadata } from '@sagebrush/alexandria';

export const useArticleMeta = (id: string): ArticleMetadata | undefined => {
    const { articlesMetadata } = useContext(AlexandriaContext);
    const articleMetadata = articlesMetadata[id];

    if (articleMetadata === undefined) {
        console.error(`Link to "${id}" but article not found`);
    }

    return articleMetadata;
};
