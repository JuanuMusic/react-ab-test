import React from 'react';
import { v4 as UUID } from 'uuid';
import { renderWithWrapper } from '../test-utils';
import { act } from '@testing-library/react';

import CoreExperiment from '../../src/CoreExperiment';
import Experiment from '../../src/Experiment';
import Variant from '../../src/Variant';
import emitter from '../../src/emitter';

describe('Emitter', () => {
  afterEach(() => {
    emitter._reset();
  });

  it('should throw an error when passed an invalid name argument.', () => {
    expect(() => {
      // @ts-expect-error - intentionally passing wrong type for test
      emitter.emitWin(1);
    }).toThrow(/type \'string\'/);
  });

  it('should emit when a variant is played.', () => {
    const experimentName = UUID();
    // TODO: use spies?
    let playedVariantName = null;
    const playCallback = (experimentName, variantName) => {
      playedVariantName = variantName;
    };

    let experimentNameGlobal = null;
    let playedVariantNameGlobal = null;
    const playCallbackGlobal = (experimentName, variantName) => {
      experimentNameGlobal = experimentName;
      playedVariantNameGlobal = variantName;
    };

    const playSubscription = emitter.addPlayListener(
      experimentName,
      playCallback
    );
    const playSubscriptionGlobal = emitter.addPlayListener(playCallbackGlobal);

    renderWithWrapper(
      <CoreExperiment name={experimentName} defaultVariantName="A">
        <Variant name="A">
          <div id="variant-a" />
        </Variant>
        <Variant name="B">
          <div id="variant-a" />
        </Variant>
      </CoreExperiment>
    );

    expect(playedVariantName).toBe('A');
    expect(experimentNameGlobal).toBe(experimentName);
    expect(playedVariantNameGlobal).toBe('A');
    playSubscription.remove();
    playSubscriptionGlobal.remove();
  });

  it('should emit when a variant wins.', () => {
    const experimentName = UUID();
    let winningVariantName = null;
    const winCallback = (experimentName, variantName) => {
      winningVariantName = variantName;
    };
    let experimentNameGlobal = null;
    let winningVariantNameGlobal = null;
    const winCallbackGlobal = (experimentName, variantName) => {
      experimentNameGlobal = experimentName;
      winningVariantNameGlobal = variantName;
    };
    const winSubscription = emitter.addWinListener(experimentName, winCallback);
    const winSubscriptionGlobal = emitter.addWinListener(winCallbackGlobal);

    renderWithWrapper(
      <CoreExperiment name={experimentName} defaultVariantName="A">
        <Variant name="A">
          <div id="variant-a" />
        </Variant>
        <Variant name="B">
          <div id="variant-a" />
        </Variant>
      </CoreExperiment>
    );

    emitter.emitWin(experimentName);

    expect(winningVariantName).toBe('A');
    expect(experimentNameGlobal).toBe(experimentName);
    expect(winningVariantNameGlobal).toBe('A');

    winSubscription.remove();
    winSubscriptionGlobal.remove();
  });

  it('should emit when a variant is clicked.', () => {
    const experimentName = UUID();

    let winningVariantName = null;
    const winCallback = (experimentName, variantName) => {
      winningVariantName = variantName;
    };
    let experimentNameGlobal = null;
    let winningVariantNameGlobal = null;
    const winCallbackGlobal = (experimentName, variantName) => {
      experimentNameGlobal = experimentName;
      winningVariantNameGlobal = variantName;
    };
    const winSubscription = emitter.addWinListener(experimentName, winCallback);
    const winSubscriptionGlobal = emitter.addWinListener(winCallbackGlobal);

    class App extends React.Component {
      onClickVariant = () => {
        emitter.emitWin(experimentName);
      };

      render() {
        return (
          <Experiment name={experimentName} defaultVariantName="A">
            <Variant name="A">
              <a id="variant-a" href="#A" onClick={this.onClickVariant}>
                A
              </a>
            </Variant>
            <Variant name="B">
              <a id="variant-b" href="#B" onClick={this.onClickVariant}>
                B
              </a>
            </Variant>
          </Experiment>
        );
      }
    }

    let wrapper;
    act(() => {
      wrapper = renderWithWrapper(<App />);
    });

    act(() => {
      wrapper.find('#variant-a').click();
    });

    expect(winningVariantName).toBe('A');
    expect(experimentNameGlobal).toBe(experimentName);
    expect(winningVariantNameGlobal).toBe('A');

    winSubscription.remove();
    winSubscriptionGlobal.remove();
  });

  it('should emit when a variant is chosen.', () => {
    const experimentName = UUID();
    let activeVariantName = null;
    const activeVariantCallback = function (experimentName, variantName) {
      activeVariantName = variantName;
    };
    let experimentNameGlobal = null;
    let activeVariantNameGlobal = null;
    const activeVariantCallbackGlobal = function (experimentName, variantName) {
      experimentNameGlobal = experimentName;
      activeVariantNameGlobal = variantName;
    };
    const activeVariantSubscription = emitter.addActiveVariantListener(
      experimentName,
      activeVariantCallback
    );
    const activeVariantSubscriptionGlobal = emitter.addActiveVariantListener(
      activeVariantCallbackGlobal
    );

    renderWithWrapper(
      <Experiment name={experimentName} defaultVariantName="A">
        <Variant name="A">
          <a id="variant-a" href="#A">
            A
          </a>
        </Variant>
        <Variant name="B">
          <a id="variant-b" href="#B">
            B
          </a>
        </Variant>
      </Experiment>
    );

    expect(activeVariantName).toBe('A');
    expect(experimentNameGlobal).toBe(experimentName);
    expect(activeVariantNameGlobal).toBe('A');

    activeVariantSubscription.remove();
    activeVariantSubscriptionGlobal.remove();
  });

  it('should get the experiment value.', () => {
    const experimentName = UUID();

    renderWithWrapper(
      <Experiment name={experimentName} defaultVariantName="A">
        <Variant name="A">
          <a id="variant-a" href="#A">
            A
          </a>
        </Variant>
        <Variant name="B">
          <a id="variant-b" href="#B">
            B
          </a>
        </Variant>
      </Experiment>
    );

    expect(emitter.getActiveVariant(experimentName)).toBe('A');
  });

  it('should update the rendered component.', () => {
    const experimentName = UUID();

    let wrapper;
    act(() => {
      wrapper = renderWithWrapper(
        <CoreExperiment name={experimentName} defaultVariantName="A">
          <Variant name="A">
            <div id="variant-a" />
          </Variant>
          <Variant name="B">
            <div id="variant-b" />
          </Variant>
        </CoreExperiment>
      );
    });

    expect(wrapper.find('#variant-a').exists()).toBeTruthy();
    expect(wrapper.find('#variant-b').exists()).toBeFalsy();

    act(() => {
      emitter.setActiveVariant(experimentName, 'B');
    });

    expect(wrapper.find('#variant-a').exists()).toBeFalsy();
    expect(wrapper.find('#variant-b').exists()).toBeTruthy();
  });

  it('should report active components.', () => {
    const experimentNameA = UUID();
    const experimentNameB = UUID();

    const AppA = () => (
      <CoreExperiment name={experimentNameA} defaultVariantName="A">
        <Variant name="A">
          <div id="variant-a" />
        </Variant>
        <Variant name="B">
          <div id="variant-b" />
        </Variant>
      </CoreExperiment>
    );

    const AppB = () => (
      <Experiment name={experimentNameB} defaultVariantName="C">
        <Variant name="C">
          <div id="variant-a" />
        </Variant>
        <Variant name="D">
          <div id="variant-b" />
        </Variant>
      </Experiment>
    );

    const AppCombined = () => (
      <div>
        <AppA />
        <AppB />
      </div>
    );

    // Test each component separately
    let wrapper;

    // First, test AppA
    emitter._reset(); // Ensure clean state
    act(() => {
      wrapper = renderWithWrapper(<AppA />);
    });

    const experimentsA = emitter.getActiveExperiments();
    expect(experimentsA).toEqual({
      [experimentNameA]: {
        A: true,
        B: false,
      },
    });
    wrapper.unmount();

    // Then, test AppB
    emitter._reset(); // Ensure clean state
    act(() => {
      wrapper = renderWithWrapper(<AppB />);
    });

    const experimentsB = emitter.getActiveExperiments();
    expect(experimentsB).toEqual({
      [experimentNameB]: {
        C: true,
        D: false,
      },
    });
    wrapper.unmount();

    // Finally, test combined app
    emitter._reset(); // Ensure clean state
    act(() => {
      wrapper = renderWithWrapper(<AppCombined />);
    });

    const experimentsCombined = emitter.getActiveExperiments();
    expect(experimentsCombined).toEqual({
      [experimentNameA]: {
        A: true,
        B: false,
      },
      [experimentNameB]: {
        C: true,
        D: false,
      },
    });
  });

  it('should force the calculation of an active variant', () => {
    const experimentName = UUID();
    emitter.defineVariants(experimentName, ['A', 'B']);
    const activeVariant = emitter.calculateActiveVariant(experimentName);
    expect(activeVariant).toEqual(emitter.getActiveVariant(experimentName));
  });

  it('should use custom distribution algorithm when set', () => {
    const experimentName = UUID();
    emitter.defineVariants(experimentName, ['A', 'B']);
    emitter.setCustomDistributionAlgorithm((_experimentName, userIdentifier) =>
      parseInt(userIdentifier || '0') % 4 === 0 ? 'A' : 'B'
    );
    const variants = [...Array(6).keys()].map((userIdentifier) =>
      emitter.calculateActiveVariant(experimentName, userIdentifier.toString())
    );

    expect(variants).toEqual(['A', 'B', 'B', 'B', 'A', 'B']);
  });

  it('should findDOMNode or the browser.', () => {
    const experimentName = UUID();

    let wrapper;
    act(() => {
      wrapper = renderWithWrapper(
        <CoreExperiment name={experimentName} defaultVariantName="A">
          <Variant name="A">
            <div id="variant-a" />
          </Variant>
          <Variant name="B">
            <div id="variant-b" />
          </Variant>
        </CoreExperiment>
      );
    });

    expect(wrapper.find('#variant-a').exists()).toBeTruthy();
    expect(wrapper.find('#variant-b').exists()).toBeFalsy();

    act(() => {
      emitter.setActiveVariant(experimentName, 'B');
    });

    expect(wrapper.find('#variant-a').exists()).toBeFalsy();
    expect(wrapper.find('#variant-b').exists()).toBeTruthy();
  });
});
