import React, { FunctionComponent } from 'react';
import { EuiTabbedContent, EuiTabbedContentProps } from '@elastic/eui/lib/components/tabs/tabbed_content';

const Tabs: FunctionComponent<EuiTabbedContentProps> = (props => {
  return (
    <EuiTabbedContent {...props} />
  );
});

export default Tabs;
