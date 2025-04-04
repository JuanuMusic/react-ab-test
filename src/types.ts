import { ReactNode } from 'react';

export interface ExperimentProps {
  name: string;
  defaultVariantName?: string;
  userIdentifier?: string;
  children?: ReactNode;
}

export interface VariantProps {
  name: string;
  children?: ReactNode;
}

export interface EmitterListener {
  remove: () => void;
}

export interface VariantMap {
  [key: string]: ReactNode;
}

export interface ExperimentHookResult {
  experimentName: string;
  activeVariant: string;
  emitWin: () => void;
  selectVariant: <T>(variants: Record<string, T>, fallback: T) => T;
}

export interface ExperimentValues {
  [experimentName: string]: string;
}

export interface ExperimentVariants {
  [experimentName: string]: {
    [variantName: string]: boolean;
  };
}

export interface ExperimentWeights {
  [experimentName: string]: {
    [variantName: string]: number;
  };
}

export interface ActiveExperiments {
  [experimentName: string]: number;
}

export interface ExperimentsWithDefinedVariants {
  [experimentName: string]: string[];
}

export interface PlayedExperiments {
  [experimentName: string]: boolean;
}

export interface ExperimentStatus {
  [experimentName: string]: {
    [variantName: string]: boolean;
  };
}
