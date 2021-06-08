import React, { ReactNode } from 'react';

export default ({ type: Component = 'h1', children, sub }: { type: 'h1' | 'h2', children: ReactNode, sub: ReactNode }) => {
    return (
        <div>
            {sub && <sub>{sub}</sub>}
            <Component className="heading">{children}</Component>
        </div>
    );
}
