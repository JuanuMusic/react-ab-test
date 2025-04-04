import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';

import Experiment from './lib/Experiment';
import Variant from './lib/Variant';
import experimentDebugger from './lib/debugger';
// Normally the library would be imported with:
// import { Experiment, Variant, experimentDebugger } from '@juanu/react-ab-test

experimentDebugger.enable();

function App() {
  return (
    <div class="ab-test">
      <div>
        <h1>Experiment 1</h1>
        <Experiment name="Experiment 1">
          <Variant name="A">
            <h2>Variant A</h2>
          </Variant>
          <Variant name="B">
            <h2>Variant B</h2>
          </Variant>
        </Experiment>
        <h1>Experiment 2</h1>
        <Experiment name="Experiment 2">
          <Variant name="X">
            <h2>Variant X</h2>
          </Variant>
          <Variant name="Y">
            <h2>Variant Y</h2>
          </Variant>
        </Experiment>
      </div>
    </div>
  );
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);
