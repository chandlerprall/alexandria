import React, { FunctionComponent } from 'react';
import { CommonProps } from '@elastic/eui';

export type DocLinkProps = CommonProps & {
    id: string;
    section?: string;
    text?: string;
    tooltip?: boolean;
};

// TODO: Gatsby doesn't let you pass variables in static queries. As a workaround, this
// fetches the full list, then filters out the one we need by id. It likely is terribly
// unperformant and we should find another way to do this.
export const DocLink: FunctionComponent<DocLinkProps> = ({
                                                             id,
                                                             section,
                                                             tooltip,
                                                             text,
                                                         }) => {
    return <a href="#">{text || id}</a>;
};
