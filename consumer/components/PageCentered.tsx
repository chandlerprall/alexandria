import React, { HTMLAttributes } from 'react';
import { css } from '@emotion/react';

export default (props: HTMLAttributes<HTMLDivElement>) => (
    <div css={css`
        margin: 0 auto;
        padding: 0 10px;
        max-width: 1000px;
    `} {...props} />
);
