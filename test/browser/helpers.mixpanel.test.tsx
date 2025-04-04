import React from 'react';
import { v4 as UUID } from 'uuid';
import { renderWithWrapper } from '../test-utils';

import CoreExperiment from '../../src/CoreExperiment';
import Variant from '../../src/Variant';
import emitter from '../../src/emitter';
import mixpanelHelper from '../../src/helpers/mixpanel';

// Define a proper interface for Mixpanel
interface MixpanelInstance {
  track: (event: string, properties?: Record<string, unknown>) => void;
}

// Extend Window interface to include mixpanel
declare global {
  interface Window {
    mixpanel?: MixpanelInstance;
  }
}

describe('Mixpanel Helper', () => {
  it('should error if Mixpanel global is not set', () => {
    expect(() => mixpanelHelper.enable()).toThrow(
      /React A\/B Test Mixpanel Helper: 'mixpanel' global is not defined/
    );
  });

  it('should error if Mixpanel is disabled before it is enabled', () => {
    expect(() => mixpanelHelper.disable()).toThrow(
      /React A\/B Test Mixpanel Helper: Helper was disabled without being enabled first/
    );
  });

  it('should report results to Mixpanel', () => {
    const experimentName = UUID();
    const variantName = 'A';

    window.mixpanel = {
      track: jest.fn(),
    };
    const spy = jest.spyOn(window.mixpanel, 'track');

    mixpanelHelper.enable();

    renderWithWrapper(
      <CoreExperiment name={experimentName} defaultVariantName={variantName}>
        <Variant name="A">
          <div id="variant-a" />
        </Variant>
        <Variant name="B">
          <div id="variant-b" />
        </Variant>
      </CoreExperiment>
    );

    emitter.emitWin(experimentName);

    expect(spy.mock.calls.length).toBe(2);

    expect(spy.mock.calls[0][0]).toBe('Experiment Viewed');
    expect(spy.mock.calls[0][1]).toEqual({
      experimentName: experimentName,
      variationName: variantName,
    });

    expect(spy.mock.calls[1][0]).toBe('Experiment Won');
    expect(spy.mock.calls[1][1]).toEqual({
      experimentName: experimentName,
      variationName: variantName,
    });

    mixpanelHelper.disable();
    delete window.mixpanel;
  });
});
