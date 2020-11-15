import {FunctionComponent, ReactElement, createElement, useContext, ComponentType} from 'react';
import {AlexandriaContext} from './context';

const MdxProps = new Set(['mdxType', 'originalType']);

function mapChildrenToDefinitions(children: ReactElement | ReactElement[], componentMapToPath: Map<ComponentType, string>): Object {
  if (Array.isArray(children)) {
    return children.map(child => mapChildrenToDefinitions(child, componentMapToPath));
  }

  if (typeof children === 'string') {
    return {
      component: 'span',
      props: { children }
    };
  }

  // @ts-ignore
  let component = children.props?.mdxType ?? componentMapToPath.get(children.type);
  const definition = {
      component,
      props: {},
  }

  const propKeys = children.props ? Object.keys(children.props) : [];
  for (let i = 0; i < propKeys.length; i++) {
    const propKey = propKeys[i];
    if (MdxProps.has(propKey)) continue;

    if (propKey === 'children') {
      // @ts-ignore
      definition.props.children = mapChildrenToDefinitions(children.props.children, componentMapToPath)
    } else {
      // @ts-ignore
      definition.props[propKey] = children.props[propKey];
    }
  }
  return definition;
}

let nextDynamicsId = 0;
export const Dynamic: FunctionComponent<{ children: ReactElement }> = ({ children }) => {
  const dynamicsId = `dynamic-${nextDynamicsId++}`;
  const context = useContext(AlexandriaContext);
  if (context == null || context.dynamicsReport == null) return children;

  const { dynamicsReport, componentMapToPath } = context;

  const definition = mapChildrenToDefinitions(children, componentMapToPath);

  dynamicsReport(dynamicsId, definition);

  return createElement(
    AlexandriaContext.Provider,
    // @ts-ignore
    { value: { ...context, dynamicsReport: null } },
    createElement(
      'div',
      { id: dynamicsId },
      children
    )
  )
};
