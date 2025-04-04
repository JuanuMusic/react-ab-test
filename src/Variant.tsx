import React from 'react';
import { VariantProps } from './types';

export function Variant(props: VariantProps) {
  if (React.isValidElement(props.children)) {
    return props.children;
  } else {
    return <span>{props.children}</span>;
  }
}

Variant.displayName = 'Pushtell.Variant';

export default Variant;
