import React from 'react';
import { v4 as UUID } from 'uuid';
import { renderWithWrapper } from '../test-utils';

import useExperiment from '../../src/hook';
import emitter from '../../src/emitter';

describe('useExperiment', function () {
  let name;

  const App = () => {
    const { experimentName, activeVariant, selectVariant, emitWin } =
      useExperiment(name, undefined, 'A');

    expect(experimentName).toEqual(name);
    expect(activeVariant).toEqual('A');

    const variant = selectVariant(
      {
        A: <div id="variant-a" />,
        B: <div id="variant-b" />,
      },
      <div>Default variant</div>
    );

    return (
      <div>
        {variant}
        <button id="cta" onClick={emitWin}>
          click
        </button>
      </div>
    );
  };

  beforeEach(() => {
    name = UUID();
    emitter.defineVariants(name, ['A', 'B']);
  });

  afterEach(() => {
    emitter._reset();
  });

  it('should render the correct variant.', () => {
    const wrapper = renderWithWrapper(<App />);
    expect(!wrapper.find('#variant-a').exists());
    expect(wrapper.find('#variant-b').exists());
  });

  it('should emit play when mounted', () => {
    const listener = jest.fn();
    emitter.addPlayListener(listener);

    renderWithWrapper(<App />);
    expect(listener).toHaveBeenCalledWith(name, 'A');
  });

  it('should emit a win with activeVariant', () => {
    const listener = jest.fn();
    emitter.addWinListener(listener);

    const wrapper = renderWithWrapper(<App />);
    wrapper.find('#cta').click();
    expect(listener).toHaveBeenCalledWith(name, 'A');
  });
});
