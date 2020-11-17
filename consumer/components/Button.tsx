import React, { FunctionComponent } from 'react';
import { EuiButton } from '@elastic/eui/lib/components/button';
const Button: FunctionComponent<any> = ({ children, ...props }) => <EuiButton {...props}>{children}</EuiButton>;
export default Button;