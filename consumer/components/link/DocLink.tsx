import React, { FunctionComponent, Fragment } from 'react';
import { CommonProps, EuiToolTip, EuiImage, EuiBadge } from '@elastic/eui';
import DocModal from '../modal/DocModal';
import {useArticleMeta} from '../utils/useArticleMeta';

export type DocLinkProps = CommonProps & {
    id: string;
    section?: string;
    text?: string;
    tooltip?: boolean;
};

const DocLink: FunctionComponent<DocLinkProps> = ({
                                                             id,
                                                             section,
                                                             tooltip,
                                                             text,
                                                         }) => {
    const article = useArticleMeta(id);

    if (article === undefined) {
        // Production doesn't show a big warning modal
        if (process.env.NODE_ENV === 'production') {
            throw new Error(`${id} is not a valid id`);
        } else {
            // In dev we should alert the writer it's broken
            const linkErrorText = `${id} is not a valid link`;
            return (
                <Fragment>
                    <DocModal
                        title="Bad link"
                        body={
                            <p>
                                There is a bad link reference on this page using the id of{' '}
                                <strong>{id}</strong>
                            </p>
                        }
                    />
                    <EuiBadge color="danger" iconType="alert">
                        {linkErrorText}
                    </EuiBadge>
                </Fragment>
            );
        }
    }

    const linkText = text ? text : article.title;
    const slug = (section ? `${article.slug}#${section}` : article.slug) + '.html';

    const tooltipContent = (
        <Fragment>
            <p>{article.summary}</p>
            <br />
            {article.image !== null ? (
                <EuiImage url={article.image} alt={linkText} />
            ) : null}
        </Fragment>
    );

    if (tooltip) {
        return (
            <EuiToolTip
                title={article.title}
                content={tooltipContent}
                position="bottom">
                <a href={slug}>{linkText}</a>
            </EuiToolTip>
        );
    } else {
        return <a href={slug}>{linkText}</a>;
    }
};

export default DocLink;