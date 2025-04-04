import React from 'react';
import { v4 as UUID } from 'uuid';
import { renderWithWrapper } from '../test-utils';
import { act } from '@testing-library/react';

import CoreExperiment from '../../src/CoreExperiment';
import Variant from '../../src/Variant';
import * as experimentDebugger from '../../src/debugger';

describe('Debugger', () => {
  it('should enable and disable.', () => {
    renderWithWrapper(
      <CoreExperiment name={UUID()} defaultVariantName="A">
        <Variant name="A">
          <div id="variant-a" />
        </Variant>
      </CoreExperiment>
    );
    const getDebugger = () => document.getElementById('pushtell-debugger');

    expect(getDebugger()).toBeNull();

    act(() => {
      experimentDebugger.enable();
    });
    expect(getDebugger()).toBeDefined();

    act(() => {
      experimentDebugger.disable();
    });
    expect(getDebugger()).toBeNull();
  });

  it('should add and remove style rules', () => {
    act(() => {
      experimentDebugger.enable();
    });
    expect(hasCSSSelector('#pushtell-debugger')).toBe(true);

    act(() => {
      experimentDebugger.disable();
    });
    expect(hasCSSSelector('#pushtell-debugger')).toBe(false);
  });

  it("should change an experiment's value.", () => {
    const wrapper = renderWithWrapper(
      <CoreExperiment name={UUID()} defaultVariantName="A">
        <Variant name="A">
          <div id="variant-a" />
        </Variant>
        <Variant name="B">
          <div id="variant-a" />
        </Variant>
      </CoreExperiment>
    );

    act(() => {
      experimentDebugger.enable();
    });

    expect(wrapper.find('#variant-a').exists());
    expect(!wrapper.find('#variant-b').exists());

    act(() => {
      (
        document.querySelector(
          '#pushtell-debugger div.pushtell-handle'
        ) as HTMLElement
      )?.click();
    });

    const radioButtonA = document.querySelector(
      "#pushtell-debugger input[value='A']"
    ) as HTMLInputElement;
    const radioButtonB = document.querySelector(
      "#pushtell-debugger input[value='B']"
    ) as HTMLInputElement;
    expect(radioButtonA?.checked).toBe(true);

    act(() => {
      radioButtonB?.click();
    });

    expect(!wrapper.find('#variant-a').exists());
    expect(wrapper.find('#variant-b').exists());

    act(() => {
      experimentDebugger.disable();
    });
  });

  describe('when is not available', () => {
    beforeEach(() => {
      experimentDebugger.setDebuggerAvailable(false);
      act(() => {
        experimentDebugger.enable();
      });
    });
    it('should do nothing when enabling it', () => {
      expect(hasCSSSelector('#pushtell-debugger')).toBe(false);
    });
    afterEach(() => {
      experimentDebugger.setDebuggerAvailable(true);
    });
  });
});

// See http://stackoverflow.com/a/985070
function hasCSSSelector(s) {
  if (!document.styleSheets) {
    return '';
  }
  s = s.toLowerCase();

  for (let i = 0; i < document.styleSheets.length; i++) {
    const sheet = document.styleSheets[i];
    const rules = sheet.rules ? sheet.rules : sheet.cssRules;
    for (let j = 0; j < rules.length; j++) {
      const selector = (rules[j] as CSSStyleRule).selectorText
        ? (rules[j] as CSSStyleRule).selectorText
        : rules[j].toString();
      if (selector.toLowerCase() === s) {
        return true;
      }
    }
  }
  return false;
}
