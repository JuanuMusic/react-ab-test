import React from 'react';
import { v4 as UUID } from 'uuid';
import { renderWithWrapper } from '../test-utils';
import { act } from '@testing-library/react';

import Experiment from '../../src/Experiment';
import Variant from '../../src/Variant';
import emitter from '../../src/emitter';

describe('Experiment', function () {
  afterEach(function () {
    emitter._reset();
  });

  it('should choose a version', () => {
    const experimentName = UUID();
    const variantNames: string[] = [];
    for (let i = 0; i < 100; i++) {
      variantNames.push(UUID());
    }

    const wrapper = renderWithWrapper(
      <Experiment name={experimentName}>
        {variantNames.map((name) => {
          return (
            <Variant key={name} name={name}>
              <div id={'variant-' + name} />
            </Variant>
          );
        })}
      </Experiment>
    );

    // Check that only one variant is rendered by verifying there's only one matched DOM element
    const renderedVariants = variantNames.filter((name) =>
      wrapper.find(`#variant-${name}`).exists()
    );
    expect(renderedVariants.length).toBe(1);
  });

  it('should render the correct variant', () => {
    const experimentName = UUID();
    const variantNames: string[] = [];
    for (let i = 0; i < 100; i++) {
      variantNames.push(UUID());
    }
    const defaultVariantName =
      variantNames[Math.floor(Math.random() * variantNames.length)];

    const AppWithDefaultVariantName = () => (
      <Experiment name={experimentName} defaultVariantName={defaultVariantName}>
        {variantNames.map((name) => {
          return (
            <Variant key={name} name={name}>
              <div id={'variant-' + name} />
            </Variant>
          );
        })}
      </Experiment>
    );

    const AppWithoutDefaultVariantName = () => (
      <Experiment name={experimentName}>
        {variantNames.map((name) => {
          return (
            <Variant key={name} name={name}>
              <div id={'variant-' + name} />
            </Variant>
          );
        })}
      </Experiment>
    );

    let wrapper = renderWithWrapper(<AppWithDefaultVariantName />);
    expect(wrapper.find(`#variant-${defaultVariantName}`).exists()).toBe(true);

    wrapper = renderWithWrapper(<AppWithoutDefaultVariantName />);
    expect(wrapper.find(`#variant-${defaultVariantName}`).exists()).toBe(true);
  });

  it('should error if variants are added to a experiment after a variant was selected', () => {
    const experimentName = UUID();
    renderWithWrapper(
      <Experiment name={experimentName} defaultVariantName="A">
        <Variant name="A">
          <div id="variant-a" />
        </Variant>
        <Variant name="B">
          <div id="variant-b" />
        </Variant>
      </Experiment>
    );

    // Suppress React's error boundary logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderWithWrapper(
        <Experiment name={experimentName} defaultVariantName="A">
          <Variant name="C">
            <div id="variant-c" />
          </Variant>
          <Variant name="D">
            <div id="variant-d" />
          </Variant>
        </Experiment>
      )
    ).toThrow(expect.objectContaining({ type: 'PUSHTELL_INVALID_VARIANT' }));
  });

  it('should not error if variants are added to a experiment after a variant was selected if variants were defined', () => {
    const experimentName = UUID();
    emitter.defineVariants(experimentName, ['A', 'B', 'C', 'D']);
    const spy = jest.spyOn(console, 'error');

    renderWithWrapper(
      <Experiment name={experimentName}>
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
    expect(spy).not.toHaveBeenCalled();

    renderWithWrapper(
      <Experiment name={experimentName}>
        <Variant name="C">
          <a id="variant-c" href="#C">
            C
          </a>
        </Variant>
        <Variant name="D">
          <a id="variant-d" href="#D">
            D
          </a>
        </Variant>
      </Experiment>
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it('should error if a variant is added to an experiment after variants were defined', () => {
    const experimentName = UUID();
    emitter.defineVariants(experimentName, ['A', 'B', 'C']);

    renderWithWrapper(
      <Experiment name={experimentName}>
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

    // Suppress React's error boundary logs
    jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderWithWrapper(
        <Experiment name={experimentName}>
          <Variant name="C">
            <a id="variant-c" href="#C">
              C
            </a>
          </Variant>
          <Variant name="D">
            <a id="variant-d" href="#D">
              D
            </a>
          </Variant>
        </Experiment>
      )
    ).toThrow(expect.objectContaining({ type: 'PUSHTELL_INVALID_VARIANT' }));
  });

  it('should not error if an older test variant is set', () => {
    const experimentName = UUID();
    localStorage.setItem('PUSHTELL-' + experimentName, 'C');
    const spy = jest.spyOn(console, 'error');

    renderWithWrapper(
      <Experiment name={experimentName}>
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

    expect(spy).not.toHaveBeenCalled();
  });

  it('should choose the same variant when a user identifier is defined', () => {
    const userIdentifier = UUID();
    const experimentName = UUID();
    const variantNames: string[] = [];
    for (let i = 0; i < 100; i++) {
      variantNames.push(UUID());
    }

    const App = () => (
      <Experiment name={experimentName} userIdentifier={userIdentifier}>
        {variantNames.map((name) => {
          return (
            <Variant key={name} name={name}>
              <div id={'variant-' + name} />
            </Variant>
          );
        })}
      </Experiment>
    );

    // TODO: use spies
    let chosenVariant;
    emitter.once('play', function (experimentName, variantName) {
      chosenVariant = variantName;
    });

    renderWithWrapper(<App />);
    expect(chosenVariant).toBeDefined();

    for (let i = 0; i < 100; i++) {
      emitter._reset();
      localStorage.clear();
      const wrapper = renderWithWrapper(<App />);
      expect(wrapper.find(`#variant-${chosenVariant}`).exists()).toBe(true);
    }
  });

  it('should not not cause an infinite rendering loop when calling setState', () => {
    const userIdentifier = UUID();
    const experimentName = UUID();
    const spy = jest.spyOn(console, 'error');
    const App = () => {
      const [counter, setCounter] = React.useState(0);
      return (
        <>
          <Experiment name={experimentName} userIdentifier={userIdentifier}>
            <Variant name="A">A</Variant>
            <Variant name="B">B</Variant>
          </Experiment>

          <button
            data-testid="counter-button"
            onClick={() => setCounter(counter + 1)}
          >
            Re-render ({counter})
          </button>
        </>
      );
    };
    renderWithWrapper(<App />);

    // Get button by test ID and click it in act()
    const button = document.querySelector(
      '[data-testid="counter-button"]'
    ) as HTMLElement;
    act(() => {
      if (button) {
        button.click();
      }
    });

    expect(spy).not.toHaveBeenCalled();
  });
});
