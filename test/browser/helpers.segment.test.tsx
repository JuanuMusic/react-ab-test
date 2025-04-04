import React from 'react';
import { v4 as UUID } from 'uuid';
import { renderWithWrapper } from '../test-utils';

import CoreExperiment from '../../src/CoreExperiment';
import Variant from '../../src/Variant';
import emitter from '../../src/emitter';
import segmentHelper from '../../src/helpers/segment';

// Define a proper interface for Segment analytics
interface SegmentAnalytics {
  track: (event: string, properties?: Record<string, unknown>) => void;
}

// Extend Window interface to include analytics
declare global {
  interface Window {
    analytics?: SegmentAnalytics;
  }
}

describe('Segment Helper', () => {
  it('should error if Segment global is not set', () => {
    expect(() => segmentHelper.enable()).toThrow(
      /React A\/B Test Segment Helper: 'analytics' global is not defined/
    );
  });

  it('should error if Segment is disabled before it is enabled', () => {
    expect(() => segmentHelper.disable()).toThrow(
      /React A\/B Test Segment Helper: Helper was disabled without being enabled first/
    );
  });

  it('should report results to Segment', () => {
    const experimentName = UUID();
    const variantName = 'A';

    window.analytics = {
      track() {},
    };
    const spy = jest.spyOn(window.analytics, 'track');

    segmentHelper.enable();

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

    segmentHelper.disable();
    delete window.analytics;
  });
});
