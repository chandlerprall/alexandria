import './polyfill';
import { build } from 'alexandria';
import { join } from 'path';
import * as glob from 'glob';

build({
    outDir: join(__dirname, '..', 'out'),
    layouts: glob.sync('**/*.mdx', { cwd: join(__dirname, '..', 'layouts'), realpath: true }),
    articles: glob.sync('**/*.mdx', { cwd: join(__dirname, '..', 'articles'), realpath: true }),
    components: glob.sync('**/*.tsx', { cwd: join(__dirname, '..', 'components'), realpath: true }),
    // components: {
    //     ...components,
    //     h1: ({ children }) => <EuiTitle size="l"><h1>{children}</h1></EuiTitle>,
    //     h2: ({ children }) => <EuiTitle size="m"><h2>{children}</h2></EuiTitle>,
    //     h3: ({ children }) => <EuiTitle size="s"><h3>{children}</h3></EuiTitle>,
    //     a: (props: any) => (
    //         <EuiLink external={props.rel !== undefined ? true : false} {...props}>
    //             {props.children}
    //         </EuiLink>
    //     ),
    //     Panel: EuiPanel,
    //     FlexGroup: EuiFlexGroup,
    //     FlexItem: EuiFlexItem,
    //     Accordion: EuiAccordion,
    //     Button: EuiButton,
    // },
}).catch(console.error);
