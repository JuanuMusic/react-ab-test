import { useEffect, useState } from 'react';
import emitter from './emitter';
import { ExperimentHookResult } from './types';

const selectVariant =
  <T,>(currentVariant: string) =>
  (variants: Record<string, T>, fallback: T): T => {
    if (currentVariant in variants) {
      return variants[currentVariant];
    }
    return fallback;
  };

const useExperiment = (
  experimentName: string,
  userIdentifier?: string,
  defaultVariantName?: string
): ExperimentHookResult => {
  const [activeVariant, setActiveVariant] = useState<string>(
    emitter.calculateActiveVariant(
      experimentName,
      userIdentifier,
      defaultVariantName
    )
  );

  useEffect(() => {
    emitter._incrementActiveExperiments(experimentName);
    emitter.setActiveVariant(experimentName, activeVariant);
    emitter._emitPlay(experimentName, activeVariant);

    const variantListener = emitter.addActiveVariantListener(
      experimentName,
      (name: string, variant: string) => {
        if (name === experimentName && variant !== activeVariant) {
          setActiveVariant(variant);
        }
      }
    );
    return () => {
      variantListener.remove();
      emitter._decrementActiveExperiments(experimentName);
    };
  }, [experimentName, activeVariant]);

  return {
    experimentName,
    activeVariant,
    emitWin: () => emitter.emitWin(experimentName),
    selectVariant: selectVariant(activeVariant),
  };
};

export default useExperiment;
