import { FunctionComponent, ReactElement, createElement, useContext } from 'react';
import {AlexandriaContext} from './context';

const MdxProps = new Set(['mdxType', 'originalType']);

function mapChildrenToDefinitions(children: ReactElement | ReactElement[]): Object {
  if (Array.isArray(children)) {
    return children.map(mapChildrenToDefinitions);
  }
  const definition = {
      component: children.props.mdxType,
      props: {},
  }

  const propKeys = Object.keys(children.props);
  for (let i = 0; i < propKeys.length; i++) {
    const propKey = propKeys[i];
    if (MdxProps.has(propKey)) continue;

    if (propKey === 'children') {
      // @ts-ignore
      definition.props.children = mapChildrenToDefinitions(children.props.children)
    } else {
      // @ts-ignore
      definition.props[propKey] = children.props[propKey];
    }
  }
  return definition;
}

let nextDynamicsId = 0;
export const Dynamic: FunctionComponent<{ children: ReactElement }> = ({ children }) => {
  const { dynamicsReport } = useContext(AlexandriaContext);
  const definition = mapChildrenToDefinitions(children);
  const dynamicsId = `dynamic-${nextDynamicsId++}`;

  dynamicsReport(dynamicsId, definition);

  return createElement(
    'div',
    { id: dynamicsId },
    children
  );
};
