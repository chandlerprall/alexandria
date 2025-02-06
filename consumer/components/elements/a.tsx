import React, { FunctionComponent } from "react";

const Anchor: FunctionComponent<any> = (props) => <a {...props}>{props.children}</a>;

export default Anchor;
