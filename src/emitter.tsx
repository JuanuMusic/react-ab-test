// import { EventEmitter } from 'fbemitter'; // Remove fbemitter dependency
import calculateActiveVariant from './calculateActiveVariant';

// Define interface for event listeners
interface Listener {
  callback: (...args: unknown[]) => void;
  remove: () => void;
}

// Define callback types for experiment listeners
type ActiveVariantCallback = (
  experimentName: string,
  variantName: string,
  passthrough?: boolean
) => void;
type PlayCallback = (experimentName: string, variantName: string) => void;
type WinCallback = (experimentName: string, variantName: string) => void;

// Simple EventEmitter implementation to replace fbemitter
class SimpleEventEmitter {
  private listeners: Record<string, Listener[]> = {};

  addListener(
    eventType: string,
    callback: (...args: unknown[]) => void
  ): Listener {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }

    const listener: Listener = {
      callback,
      remove: () => {
        const index = this.listeners[eventType].indexOf(listener);
        if (index !== -1) {
          this.listeners[eventType].splice(index, 1);
        }
      },
    };

    this.listeners[eventType].push(listener);
    return listener;
  }

  once(eventType: string, callback: (...args: unknown[]) => void): Listener {
    const listener = this.addListener(eventType, (...args: unknown[]) => {
      listener.remove();
      callback(...args);
    });
    return listener;
  }

  emit(eventType: string, ...args: unknown[]): void {
    if (!this.listeners[eventType]) {
      return;
    }

    // Create a copy to avoid issues if listeners are removed during emission
    const listeners = [...this.listeners[eventType]];
    for (const listener of listeners) {
      listener.callback(...args);
    }
  }

  removeAllListeners(eventType?: string): void {
    if (eventType) {
      delete this.listeners[eventType];
    } else {
      this.listeners = {};
    }
  }
}

// Type definitions for state objects
interface ExperimentValues {
  [experimentName: string]: string;
}

interface ExperimentVariants {
  [experimentName: string]: {
    [variantName: string]: boolean;
  };
}

interface ExperimentWeights {
  [experimentName: string]: {
    [variantName: string]: number;
  };
}

interface ActiveExperiments {
  [experimentName: string]: number;
}

interface ExperimentsWithDefinedVariants {
  [experimentName: string]: boolean;
}

interface PlayedExperiments {
  [experimentName: string]: boolean;
}

// Define ExperimentStatus interface
interface ExperimentStatus {
  [experimentName: string]: {
    [variantName: string]: boolean;
  };
}

let values: ExperimentValues = {};
let experiments: ExperimentVariants = {};
let experimentWeights: ExperimentWeights = {};
let activeExperiments: ActiveExperiments = {};
let experimentsWithDefinedVariants: ExperimentsWithDefinedVariants = {};
let playedExperiments: PlayedExperiments = {};
let customDistributionAlgorithm:
  | ((
      experimentName: string,
      userIdentifier?: string,
      defaultVariantName?: string
    ) => string)
  | undefined = undefined;

const emitter = new SimpleEventEmitter();

// Create a custom Error type
interface PushtellError extends Error {
  type?: string;
}

class PushtellEventEmitter {
  emitWin(experimentName: string): void {
    if (typeof experimentName !== 'string') {
      throw new Error(
        "Required argument 'experimentName' should have type 'string'"
      );
    }
    emitter.emit('win', experimentName, values[experimentName]);
  }

  _emitPlay(experimentName: string, variantName: string): void {
    if (typeof experimentName !== 'string') {
      throw new Error(
        "Required argument 'experimentName' should have type 'string'"
      );
    }
    if (typeof variantName !== 'string') {
      throw new Error(
        "Required argument 'variantName' should have type 'string'"
      );
    }
    if (!playedExperiments[experimentName]) {
      emitter.emit('play', experimentName, variantName);
      playedExperiments[experimentName] = true;
    }
  }

  _resetPlayedExperiments(): void {
    values = {};
    playedExperiments = {};
  }

  _reset(): void {
    values = {};
    experiments = {};
    experimentWeights = {};
    activeExperiments = {};
    experimentsWithDefinedVariants = {};
    playedExperiments = {};
    customDistributionAlgorithm = undefined;
  }

  rewind(): void {
    this._reset();
    emitter.removeAllListeners();
  }

  _incrementActiveExperiments(experimentName: string): void {
    activeExperiments[experimentName] = activeExperiments[experimentName] || 0;
    activeExperiments[experimentName] += 1;
    emitter.emit('active', experimentName);
  }

  _decrementActiveExperiments(experimentName: string): void {
    activeExperiments[experimentName] -= 1;
    emitter.emit('inactive', experimentName);
  }

  addActiveVariantListener(
    experimentName: string | ActiveVariantCallback,
    callback?: ActiveVariantCallback
  ): Listener {
    if (typeof experimentName === 'function') {
      callback = experimentName;
      return emitter.addListener('active-variant', ((...args: unknown[]) => {
        const [_experimentName, variantName, passthrough] = args as [
          string,
          string,
          boolean?
        ];
        callback!(_experimentName, variantName, passthrough);
      }) as (...args: unknown[]) => void);
    }
    return emitter.addListener('active-variant', ((...args: unknown[]) => {
      const [_experimentName, variantName, passthrough] = args as [
        string,
        string,
        boolean?
      ];
      if (_experimentName === experimentName) {
        callback!(_experimentName, variantName, passthrough);
      }
    }) as (...args: unknown[]) => void);
  }

  emit(eventName: string, ...args: unknown[]): void {
    return emitter.emit(eventName, ...args);
  }

  addListener(
    eventName: string,
    callback: (...args: unknown[]) => void
  ): Listener {
    return emitter.addListener(eventName, callback);
  }

  once(eventName: string, callback: (...args: unknown[]) => void): Listener {
    return emitter.once(eventName, callback);
  }

  addPlayListener(
    experimentName: string | PlayCallback,
    callback?: PlayCallback
  ): Listener {
    if (typeof experimentName === 'function') {
      callback = experimentName;
      return emitter.addListener('play', ((...args: unknown[]) => {
        const [_experimentName, variantName] = args as [string, string];
        callback!(_experimentName, variantName);
      }) as (...args: unknown[]) => void);
    }
    return emitter.addListener('play', ((...args: unknown[]) => {
      const [_experimentName, variantName] = args as [string, string];
      if (_experimentName === experimentName) {
        callback!(_experimentName, variantName);
      }
    }) as (...args: unknown[]) => void);
  }

  addWinListener(
    experimentName: string | WinCallback,
    callback?: WinCallback
  ): Listener {
    if (typeof experimentName === 'function') {
      callback = experimentName;
      return emitter.addListener('win', ((...args: unknown[]) => {
        const [_experimentName, variantName] = args as [string, string];
        callback!(_experimentName, variantName);
      }) as (...args: unknown[]) => void);
    }
    return emitter.addListener('win', ((...args: unknown[]) => {
      const [_experimentName, variantName] = args as [string, string];
      if (_experimentName === experimentName) {
        callback!(_experimentName, variantName);
      }
    }) as (...args: unknown[]) => void);
  }

  setCustomDistributionAlgorithm(
    customAlgorithm: (
      experimentName: string,
      userIdentifier?: string,
      defaultVariantName?: string
    ) => string
  ): void {
    customDistributionAlgorithm = customAlgorithm;
  }

  defineVariants(
    experimentName: string,
    variantNames: string[],
    variantWeights?: number[]
  ): void {
    const variantsNamesMap: Record<string, boolean> = {};
    const variantWeightsMap: Record<string, number> = {};

    variantNames.forEach((variantName: string) => {
      variantsNamesMap[variantName] = true;
    });

    if (Array.isArray(variantWeights)) {
      if (variantNames.length !== variantWeights.length) {
        throw new Error(
          "Required argument 'variantNames' should have the same number of elements as optional argument 'variantWeights'"
        );
      }
      variantNames.forEach((variantName: string, index: number) => {
        if (typeof variantWeights[index] !== 'number') {
          throw new Error(
            "Optional argument 'variantWeights' should be an array of numbers."
          );
        }
        variantWeightsMap[variantName] = variantWeights[index];
      });
    } else {
      variantNames.forEach((variantName: string) => {
        variantWeightsMap[variantName] = 1;
      });
    }
    experimentWeights[experimentName] = variantWeightsMap;
    experiments[experimentName] = variantsNamesMap;
    experimentsWithDefinedVariants[experimentName] = true;
  }

  getSortedVariants(experimentName: string): string[] {
    const variantNames = Object.keys(experiments[experimentName]);
    variantNames.sort();
    return variantNames;
  }

  getSortedVariantWeights(experimentName: string): number[] {
    return this.getSortedVariants(experimentName).map((variantName: string) => {
      return experimentWeights[experimentName][variantName];
    });
  }

  getActiveExperiments(): ExperimentStatus {
    const response: ExperimentStatus = {};
    if (!Object.keys(experiments).length) {
      return response;
    }

    Object.keys(activeExperiments).forEach((experimentName) => {
      if (activeExperiments[experimentName] < 1) {
        return;
      }
      response[experimentName] = {};
      if (experiments[experimentName]) {
        Object.keys(experiments[experimentName]).forEach((variantName) => {
          response[experimentName][variantName] =
            values[experimentName] === variantName;
        });
      }
    });

    return response;
  }

  calculateActiveVariant(
    experimentName: string,
    userIdentifier?: string,
    defaultVariantName?: string
  ): string {
    if (customDistributionAlgorithm !== undefined) {
      return customDistributionAlgorithm(
        experimentName,
        userIdentifier,
        defaultVariantName
      );
    }

    const variant = calculateActiveVariant(
      experimentName,
      userIdentifier,
      defaultVariantName
    );
    return variant;
  }

  getActiveVariant(experimentName: string): string {
    return values[experimentName];
  }

  setActiveVariant(
    experimentName: string,
    variantName: string,
    passthrough?: boolean
  ): void {
    values[experimentName] = variantName;
    emitter.emit('active-variant', experimentName, variantName, passthrough);
  }

  addExperimentVariant(experimentName: string, variantName: string): void {
    experiments[experimentName] = experiments[experimentName] || {};
    experimentWeights[experimentName] = experimentWeights[experimentName] || {};
    if (experiments[experimentName][variantName] !== true) {
      if (experimentsWithDefinedVariants[experimentName]) {
        const error = new Error(
          'Experiment "' +
            experimentName +
            '" added new variants after variants were defined.'
        ) as PushtellError;
        error.type = 'PUSHTELL_INVALID_VARIANT';
        throw error;
      }
      if (values[experimentName]) {
        const error = new Error(
          'Experiment "' +
            experimentName +
            '" added new variants after a variant was selected. Declare the variant names using emitter.defineVariants(experimentName, variantNames).'
        ) as PushtellError;
        error.type = 'PUSHTELL_INVALID_VARIANT';
        throw error;
      }
      experimentWeights[experimentName][variantName] = 1;
    }
    experiments[experimentName][variantName] = true;
  }
}

export default new PushtellEventEmitter();
