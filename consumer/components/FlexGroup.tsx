import React, { FunctionComponent } from 'react';
import { EuiFlexGroup } from '@elastic/eui';
const FlexGroup: FunctionComponent<any> = ({ children, ...props }) => <EuiFlexGroup {...props}>{children}</EuiFlexGroup>;
export default FlexGroup;