import './polyfill';
import React from 'react';
import { build } from 'alexandria';
import { join } from 'path';
import * as glob from 'glob';
import { EuiLink, EuiTitle } from '@elastic/eui';
import components from './components';

build({
    outDir: join(__dirname, '..', 'out'),
    articles: glob.sync('**', { cwd: join(__dirname, '..', 'articles'), realpath: true }),
    components: {
        ...components,
        h1: ({ children }) => <EuiTitle size="l"><h1>{children}</h1></EuiTitle>,
        h2: ({ children }) => <EuiTitle size="m"><h2>{children}</h2></EuiTitle>,
        h3: ({ children }) => <EuiTitle size="s"><h3>{children}</h3></EuiTitle>,
        a: (props: any) => (
            <EuiLink external={props.rel !== undefined ? true : false} {...props}>
                {props.children}
            </EuiLink>
        ),
        Tabs: join(__dirname, '..', 'src', 'dynamic', 'tabs.tsx')
    },
}).catch(console.error);
