import React, { FunctionComponent } from 'react';
import { EuiLink, EuiLinkProps } from '@elastic/eui/lib/components/link';

const Anchor: FunctionComponent<any> = (props) => (
    <EuiLink external={props.rel !== undefined ? true : false} {...props}>
        {props.children}
    </EuiLink>
);

export default Anchor;