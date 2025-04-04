import React from 'react';
import { renderWithWrapper } from '../test-utils';

import CoreExperiment from '../../src/CoreExperiment';
import Variant from '../../src/Variant';

describe('Variant', () => {
  it('should render text nodes', () => {
    const variantTextA = 'variantTextA';
    const variantTextB = 'variantTextB';

    renderWithWrapper(
      <CoreExperiment name="text-nodes" defaultVariantName="A">
        <Variant name="A">{variantTextA}</Variant>
        <Variant name="B">{variantTextB}</Variant>
      </CoreExperiment>
    );

    // Since CoreExperiment only renders the active variant (A),
    // we should find its content in the document
    const content = document.body.textContent;
    expect(content).toContain(variantTextA);
    expect(content).not.toContain(variantTextB);
  });

  it('should render components', () => {
    const wrapper = renderWithWrapper(
      <CoreExperiment name="components" defaultVariantName="A">
        <Variant name="A">
          <div id="variant-a" />
        </Variant>
        <Variant name="B">
          <div id="variant-b" />
        </Variant>
      </CoreExperiment>
    );

    expect(wrapper).toMatchSnapshot();
  });

  it('should render arrays of components', () => {
    const wrapper = renderWithWrapper(
      <CoreExperiment name="array-of-elements" defaultVariantName="A">
        <Variant name="A">
          <div id="variant-a" />
          <div />
        </Variant>
        <Variant name="B">
          <div id="variant-b" />
          <div />
        </Variant>
      </CoreExperiment>
    );

    expect(wrapper).toMatchSnapshot();
  });
});
