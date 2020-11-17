import React, { FunctionComponent } from 'react';
import { EuiCallOut, CommonProps, EuiCallOutProps } from '@elastic/eui';
import { DocCallOutTemplates } from './callout_templates';

export type DocCallOutProps = CommonProps & {
    color?: EuiCallOutProps['color'];
    title?: EuiCallOutProps['title'];
    template?: 'development' | 'experimental' | 'beta';
};

export type DocCallOutTemplate = {
    id: DocCallOutProps['template'];
    title: DocCallOutProps['title'];
    message: React.ReactNode;
    color: DocCallOutProps['color'];
};

const DocCallOut: FunctionComponent<DocCallOutProps> = ({
                                                                   color,
                                                                   title,
                                                                   template,
                                                                   children,
                                                               }: any) => {
    if (template !== undefined) {
        const templateData = DocCallOutTemplates.find(({ id }) => id === template);
        return (
            <EuiCallOut
                title={templateData?.title}
                color={templateData?.color}
                children={templateData?.message}
                className="docCallOut"
            />
        );
    } else {
        return (
            <EuiCallOut title={title} color={color} className="docCallOut">
                {children}
            </EuiCallOut>
        );
    }
};

export default DocCallOut;
