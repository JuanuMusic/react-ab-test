import React, { useMemo } from 'react';
import useExperiment from './hook';
import emitter from './emitter';
import { ExperimentProps, VariantMap } from './types';

interface ErrorWithType extends Error {
  type?: string;
}

const filterVariants = (
  name: string,
  children: React.ReactNode
): VariantMap => {
  const variants: VariantMap = {};

  React.Children.forEach(children, (element) => {
    if (
      !React.isValidElement(element) ||
      !element.type ||
      typeof element.type === 'string' ||
      (element.type as React.ComponentType).displayName !== 'Pushtell.Variant'
    ) {
      const error: ErrorWithType = new Error(
        'Pushtell Experiment children must be Pushtell Variant components.'
      );
      error.type = 'PUSHTELL_INVALID_CHILD';
      throw error;
    }
    variants[element.props.name] = element;
    emitter.addExperimentVariant(name, element.props.name);
  });

  emitter.emit('variants-loaded', name);
  return variants;
};

const CoreExperiment = (props: ExperimentProps): React.ReactElement => {
  const variants = useMemo(() => {
    return filterVariants(props.name, props.children);
  }, [props.name, props.children]);

  const { selectVariant } = useExperiment(
    props.name,
    props.userIdentifier,
    props.defaultVariantName
  );

  return selectVariant(
    variants,
    React.createElement(React.Fragment)
  ) as React.ReactElement;
};

export default CoreExperiment;
