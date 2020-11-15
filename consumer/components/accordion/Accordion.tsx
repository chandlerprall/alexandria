import React, { FunctionComponent } from 'react';
import { EuiAccordion, EuiAccordionProps } from '@elastic/eui/lib/components/accordion';

const Accordion: FunctionComponent<EuiAccordionProps> = (({ children, ...props }) => {
  return (
      <EuiAccordion {...props}>{children}</EuiAccordion>
  );
});

export default Accordion;
