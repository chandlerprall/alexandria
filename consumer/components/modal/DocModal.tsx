import React, {
    FunctionComponent,
    useState,
    HTMLAttributes,
    ReactElement,
} from 'react';
import classNames from 'classnames';
import {
    CommonProps,
    EuiButton,
    EuiModal,
    EuiModalBody,
    EuiModalFooter,
    EuiModalHeader,
    EuiModalHeaderTitle,
    EuiOverlayMask,
    EuiText,
} from '@elastic/eui';

export type DocModalProps = CommonProps &
    Omit<HTMLAttributes<HTMLDivElement>, 'color'> & {
    title: string;
    body: ReactElement;
};

const DocModal: FunctionComponent<DocModalProps> = ({
                                                               className,
                                                               title,
                                                               body,
                                                               ...rest
                                                           }) => {
    const classes = classNames('docVideo', className);
    const [isModalVisible, setIsModalVisible] = useState(true);

    const closeModal = () => setIsModalVisible(false);

    if (isModalVisible) {
        return (
            <EuiOverlayMask onClick={closeModal}>
                <EuiModal onClose={closeModal} className={classes} {...rest}>
                    <EuiModalHeader>
                        <EuiModalHeaderTitle>{title}</EuiModalHeaderTitle>
                    </EuiModalHeader>

                    <EuiModalBody>
                        <EuiText>{body}</EuiText>
                    </EuiModalBody>

                    <EuiModalFooter>
                        <EuiButton onClick={closeModal} fill>
                            Close
                        </EuiButton>
                    </EuiModalFooter>
                </EuiModal>
            </EuiOverlayMask>
        );
    } else {
        return null;
    }
};

export default DocModal