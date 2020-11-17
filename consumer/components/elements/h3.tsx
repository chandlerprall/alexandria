import React, { FunctionComponent } from 'react';
import { EuiTitle } from '@elastic/eui/lib/components/title';

const H3: FunctionComponent = ({ children }) => <EuiTitle size="s"><h1>{children}</h1></EuiTitle>;

export default H3;