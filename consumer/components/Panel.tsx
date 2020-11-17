import React, { FunctionComponent } from 'react';
import { EuiPanel } from '@elastic/eui/lib/components/panel';
const Panel: FunctionComponent<any> = ({ children, ...props }) => <EuiPanel {...props}>{children}</EuiPanel>;
export default Panel;