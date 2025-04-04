import React from 'react';
import ReactDOMServer from 'react-dom/server';

import Experiment from '../../src/Experiment';
import Variant from '../../src/Variant';
import emitter from '../../src/emitter';
import { v4 as UUID } from 'uuid';

const renderApp = (
  experimentName: string,
  variantNames: string[],
  userIdentifier?: string
) => {
  return () => (
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
};

describe('Experiment', () => {
  it('should render to a string.', () => {
    const experimentName = UUID();
    const App = () => (
      <Experiment name={experimentName}>
        <Variant name="A">
          <div id="variant-a" />
        </Variant>
        <Variant name="B">
          <div id="variant-b" />
        </Variant>
      </Experiment>
    );

    const result = ReactDOMServer.renderToString(<App />);
    expect(typeof result).toBe('string');
  });

  it('should choose the same variant when a user identifier is defined.', () => {
    const userIdentifier = UUID();
    const experimentName = UUID();
    const variantNames: string[] = [];
    for (let i = 0; i < 100; i++) {
      variantNames.push(UUID());
    }

    const App = renderApp(experimentName, variantNames, userIdentifier);

    const result = ReactDOMServer.renderToString(<App />);
    const match = result.match(/"(variant-[0-9a-zA-Z-]+)"/i);
    const chosenVariant = match ? match[1] : null;
    expect(chosenVariant).toBeDefined();

    expect(result.indexOf(chosenVariant as string)).not.toEqual(-1);
    for (let i = 0; i < 100; i++) {
      emitter._reset();
      const res = ReactDOMServer.renderToString(<App />);
      expect(res.indexOf(chosenVariant as string)).not.toEqual(-1);
    }
  });

  it('should render different variants with different user identifiers.', () => {
    const userIdentifier = UUID();
    const user2Identifier = UUID();
    const experimentName = UUID();
    const variantNames: string[] = [];
    for (let i = 0; i < 100; i++) {
      variantNames.push(UUID());
    }
    const FirstRender = renderApp(experimentName, variantNames, userIdentifier);
    const SecondRender = renderApp(
      experimentName,
      variantNames,
      user2Identifier
    );

    const result1 = ReactDOMServer.renderToString(<FirstRender />);
    const result2 = ReactDOMServer.renderToString(<SecondRender />);

    expect(result1).not.toEqual(result2);
  });
});
