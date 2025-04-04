import React, { Component } from 'react';
import { createRoot, Root } from 'react-dom/client';
import emitter from './emitter';

// Replace fbjs/lib/ExecutionEnvironment with our own DOM check
const canUseDOM: boolean = !!(
  typeof window !== 'undefined' &&
  window.document &&
  window.document.createElement
);

let isDebuggerAvailable = process.env.NODE_ENV !== 'production';
let debuggerRoot: Root | null = null;
let style: HTMLStyleElement | null = null;

function attachStyleSheet(): void {
  style = document.createElement('style');
  style.appendChild(document.createTextNode(''));
  document.head.appendChild(style);

  function addCSSRule(selector: string, rules: string): void {
    if (style && style.sheet && 'insertRule' in style.sheet) {
      (style.sheet as CSSStyleSheet).insertRule(
        selector + '{' + rules + '}',
        0
      );
    } else if (style && style.sheet && 'addRule' in style.sheet) {
      const sheet = style.sheet as CSSStyleSheet;
      if ('addRule' in sheet) {
        sheet.addRule(selector, rules, 0);
      }
    }
  }

  addCSSRule('#pushtell-debugger', 'z-index: 25000');
  addCSSRule('#pushtell-debugger', 'position: fixed');
  addCSSRule('#pushtell-debugger', 'transform: translateX(-50%)');
  addCSSRule('#pushtell-debugger', 'bottom: 0');
  addCSSRule('#pushtell-debugger', 'left: 50%');
  addCSSRule('#pushtell-debugger ul', 'margin: 0');
  addCSSRule('#pushtell-debugger ul', 'padding: 0 0 0 20px');
  addCSSRule('#pushtell-debugger li', 'margin: 0');
  addCSSRule('#pushtell-debugger li', 'padding: 0');
  addCSSRule('#pushtell-debugger li', 'font-size: 14px');
  addCSSRule('#pushtell-debugger li', 'line-height: 14px');
  addCSSRule('#pushtell-debugger input', 'float: left');
  addCSSRule('#pushtell-debugger input', 'margin: 0 10px 0 0');
  addCSSRule('#pushtell-debugger input', 'padding: 0');
  addCSSRule('#pushtell-debugger input', 'cursor: pointer');
  addCSSRule('#pushtell-debugger label', 'color: #999999');
  addCSSRule('#pushtell-debugger label', 'margin: 0 0 10px 0');
  addCSSRule('#pushtell-debugger label', 'cursor: pointer');
  addCSSRule('#pushtell-debugger label', 'font-weight: normal');
  addCSSRule('#pushtell-debugger label.active', 'color: #000000');
  addCSSRule('#pushtell-debugger .pushtell-experiment-name', 'font-size: 16px');
  addCSSRule('#pushtell-debugger .pushtell-experiment-name', 'color: #000000');
  addCSSRule(
    '#pushtell-debugger .pushtell-experiment-name',
    'margin: 0 0 10px 0'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-production-build-note',
    'font-size: 10px'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-production-build-note',
    'color: #999999'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-production-build-note',
    'text-align: center'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-production-build-note',
    'margin: 10px -40px 0 -10px'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-production-build-note',
    'border-top: 1px solid #b3b3b3'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-production-build-note',
    'padding: 10px 10px 5px 10px'
  );
  addCSSRule('#pushtell-debugger .pushtell-handle', 'cursor: pointer');
  addCSSRule(
    '#pushtell-debugger .pushtell-handle',
    'padding: 5px 10px 5px 10px'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-panel',
    'padding: 15px 40px 5px 10px'
  );
  addCSSRule('#pushtell-debugger .pushtell-container', 'font-size: 11px');
  addCSSRule(
    '#pushtell-debugger .pushtell-container',
    'background-color: #ebebeb'
  );
  addCSSRule('#pushtell-debugger .pushtell-container', 'color: #000000');
  addCSSRule(
    '#pushtell-debugger .pushtell-container',
    'box-shadow: 0px 0 5px rgba(0, 0, 0, 0.1)'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-container',
    'border-top: 1px solid #b3b3b3'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-container',
    'border-left: 1px solid #b3b3b3'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-container',
    'border-right: 1px solid #b3b3b3'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-container',
    'border-top-left-radius: 2px'
  );
  addCSSRule(
    '#pushtell-debugger .pushtell-container',
    'border-top-right-radius: 2px'
  );
  addCSSRule('#pushtell-debugger .pushtell-close', 'cursor: pointer');
  addCSSRule('#pushtell-debugger .pushtell-close', 'font-size: 16px');
  addCSSRule('#pushtell-debugger .pushtell-close', 'font-weight: bold');
  addCSSRule('#pushtell-debugger .pushtell-close', 'color: #CC0000');
  addCSSRule('#pushtell-debugger .pushtell-close', 'position: absolute');
  addCSSRule('#pushtell-debugger .pushtell-close', 'top: 0px');
  addCSSRule('#pushtell-debugger .pushtell-close', 'right: 7px');
  addCSSRule('#pushtell-debugger .pushtell-close:hover', 'color: #FF0000');
  addCSSRule(
    '#pushtell-debugger .pushtell-close, #pushtell-debugger label',
    'transition: all .25s'
  );
}

function removeStyleSheet(): void {
  if (style !== null) {
    document.head.removeChild(style);
    style = null;
  }
}

interface DebuggerState {
  experiments: Record<string, Record<string, boolean>>;
  visible: boolean;
}

interface EmitterSubscription {
  remove: () => void;
}

class Debugger extends Component<Record<string, never>, DebuggerState> {
  activeSubscription: EmitterSubscription | null = null;
  inactiveSubscription: EmitterSubscription | null = null;

  state: DebuggerState = {
    experiments: emitter.getActiveExperiments(),
    visible: false,
  };

  toggleVisibility = (): void => {
    this.setState({
      visible: !this.state.visible,
    });
  };

  updateExperiments = (): void => {
    this.setState({
      experiments: emitter.getActiveExperiments(),
    });
  };

  setActiveVariant(experimentName: string, variantName: string): void {
    emitter.setActiveVariant(experimentName, variantName);
  }

  componentDidMount(): void {
    this.activeSubscription = emitter.addListener(
      'active',
      this.updateExperiments
    );
    this.inactiveSubscription = emitter.addListener(
      'inactive',
      this.updateExperiments
    );
  }

  componentWillUnmount(): void {
    if (this.activeSubscription) {
      this.activeSubscription.remove();
    }
    if (this.inactiveSubscription) {
      this.inactiveSubscription.remove();
    }
  }

  render() {
    const experimentNames = Object.keys(this.state.experiments);
    if (this.state.visible) {
      return (
        <div className="pushtell-container pushtell-panel">
          <div className="pushtell-close" onClick={this.toggleVisibility}>
            ×
          </div>
          {experimentNames.map((experimentName) => {
            const variantNames = Object.keys(
              this.state.experiments[experimentName]
            );
            if (variantNames.length === 0) {
              return null;
            }
            return (
              <div className="pushtell-experiment" key={experimentName}>
                <div className="pushtell-experiment-name">{experimentName}</div>
                <ul>
                  {variantNames.map((variantName) => {
                    return (
                      <li key={variantName}>
                        <label
                          className={
                            this.state.experiments[experimentName][variantName]
                              ? 'active'
                              : undefined
                          }
                          onClick={this.setActiveVariant.bind(
                            this,
                            experimentName,
                            variantName
                          )}
                        >
                          <input
                            type="radio"
                            name={experimentName}
                            value={variantName}
                            defaultChecked={
                              this.state.experiments[experimentName][
                                variantName
                              ]
                            }
                          />
                          {variantName}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
          <div className="pushtell-production-build-note">
            This panel is hidden on production builds.
          </div>
        </div>
      );
    } else if (experimentNames.length > 0) {
      return (
        <div
          className="pushtell-container pushtell-handle"
          onClick={this.toggleVisibility}
        >
          {experimentNames.length} Active Experiment
          {experimentNames.length > 1 ? 's' : ''}
        </div>
      );
    } else {
      return null;
    }
  }
}

export const setDebuggerAvailable = (value: boolean): void => {
  isDebuggerAvailable = value;
};

export const enable = (): void => {
  if (!isDebuggerAvailable || !canUseDOM) {
    return;
  }

  attachStyleSheet();
  const body = document.getElementsByTagName('body')[0];
  const container = document.createElement('div');
  container.id = 'pushtell-debugger';
  body.appendChild(container);
  debuggerRoot = createRoot(container);
  debuggerRoot.render(<Debugger />);
};

export const disable = (): void => {
  if (!isDebuggerAvailable || !canUseDOM) {
    return;
  }

  removeStyleSheet();
  const body = document.getElementsByTagName('body')[0];
  const container = document.getElementById('pushtell-debugger');
  if (container) {
    debuggerRoot?.unmount();
    body.removeChild(container);
  }
};
