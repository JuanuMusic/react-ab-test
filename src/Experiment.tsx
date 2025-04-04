import React, { useEffect, useCallback } from 'react';
import CoreExperiment from './CoreExperiment';
import emitter from './emitter';
import store from './store';
import { ExperimentProps } from './types';

// Use simple function declaration instead of React.FC
export function Experiment(props: ExperimentProps) {
  const { name } = props;

  useEffect(() => {
    const listener = emitter.addActiveVariantListener(
      name,
      (experimentName: string, variantName: string, skipSave?: boolean) => {
        if (experimentName === name) {
          if (skipSave) {
            return;
          }
          store.setItem('PUSHTELL-' + experimentName, variantName);
        }
      }
    );

    // Cleanup listener on component unmount
    return () => {
      listener.remove();
    };
  }, [name]); // Rerun effect if experiment name changes

  useCallback((): void => {
    emitter.emitWin(name);
  }, [name]);

  // Add the win function to props passed to CoreExperiment if needed,
  // or handle win logic differently if CoreExperiment doesn't need it directly.
  // For now, just passing original props.
  return <CoreExperiment {...props}>{props.children}</CoreExperiment>;
}

Experiment.displayName = 'Pushtell.Experiment';

export default Experiment;
