import React from 'react';
import { build } from 'alexandria';
import { join } from 'path';
import * as glob from 'glob';
import { EuiLink } from '@elastic/eui';
import components from './components';

build({
    outDir: join(__dirname, '..', 'out'),
    articles: glob.sync('**', { cwd: join(__dirname, '..', 'articles'), realpath: true }),
    components: {
        ...components,
        a: (props: any) => (
            <EuiLink external={props.rel !== undefined ? true : false} {...props}>
                {props.children}
            </EuiLink>
        ),
    },
});
