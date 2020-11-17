import React, { FunctionComponent } from 'react';
import { EuiTitle } from '@elastic/eui/lib/components/title';

const H2: FunctionComponent = ({ children }) => <EuiTitle size="m"><h1>{children}</h1></EuiTitle>;

export default H2;