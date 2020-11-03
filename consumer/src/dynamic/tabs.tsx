import React, { FunctionComponent } from 'react';
import {EuiTabbedContent, EuiTabbedContentTab} from '@elastic/eui';

const Tabs: FunctionComponent<{ tabs: EuiTabbedContentTab[] }> = ({tabs}) => {
    return (
        <EuiTabbedContent
            tabs={tabs}
        />
    );
};

export default Tabs;
