import React, { FunctionComponent } from 'react';
import { EuiTitle } from '@elastic/eui/lib/components/title';

const H1: FunctionComponent = ({ children }) => <EuiTitle size="l"><h1>{children}</h1></EuiTitle>;

export default H1;