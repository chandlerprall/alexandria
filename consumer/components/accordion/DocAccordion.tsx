import React, { FunctionComponent } from 'react';
import { EuiAccordionProps } from '@elastic/eui/lib/components/accordion';
import Accordion from './Accordion';
import { Dynamic } from 'alexandria/build/dynamic';

const DocAccordion: FunctionComponent<EuiAccordionProps> = (({ children, ...props }) => {
  return (
    <Dynamic>
      <Accordion {...props}>{children}</Accordion>
    </Dynamic>
  );
});

export default DocAccordion;
