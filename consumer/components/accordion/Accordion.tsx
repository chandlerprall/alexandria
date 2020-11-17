import React, { FunctionComponent } from 'react';
import { EuiAccordion } from '@elastic/eui/lib/components/accordion';

const Accordion: FunctionComponent<any> = (({ children, ...props }) => {
  return (
      <EuiAccordion {...props}>{children}</EuiAccordion>
  );
});

export default Accordion;
