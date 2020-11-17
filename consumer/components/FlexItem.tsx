import React, { FunctionComponent } from 'react';
import { EuiFlexItem } from '@elastic/eui';
const FlexItem: FunctionComponent<any> = ({ children, ...props }) => <EuiFlexItem {...props}>{children}</EuiFlexItem>;
export default FlexItem;