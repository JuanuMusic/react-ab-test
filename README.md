[![NPM version](https://badge.fury.io/js/%40juanu%2Freact-ab-test.svg)](https://badge.fury.io/js/%40juanu%2Freact-ab-test)
[![NPM Downloads](https://img.shields.io/npm/dm/@juanu/react-ab-test.svg?style=flat)](https://www.npmjs.com/package/@juanu/react-ab-test)

# A/B Testing React Components

An updated version for the `reac-ab-test` library compatible with React 19.


Wrap components in [`<Variant />`](#variant-) and nest in [`<Experiment />`](#experiment-). A variant is chosen randomly and saved to local storage.

```js
<Experiment name="My Example">
  <Variant name="A">
    <div>Version A</div>
  </Variant>
  <Variant name="B">
    <div>Version B</div>
  </Variant>
</Experiment>
```

Report to your analytics provider using the [`emitter`](#emitter). Helpers are available for [Mixpanel](#mixpanelhelper) and [Segment.com](#segmenthelper).

```js
emitter.addPlayListener((experimentName, variantName) => {
  mixpanel.track('Start Experiment', {
    name: experimentName,
    variant: variantName,
  });
});
```

Please [★ on GitHub](https://github.com/juanumusic/react-ab-test)!

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
<h1>Table of Contents</h1>

- [Installation](#installation)
- [Usage](#usage)
  - [Standalone Component](#standalone-component)
  - [Coordinate Multiple Components](#coordinate-multiple-components)
  - [Weighting Variants](#weighting-variants)
  - [Force variant calculation before rendering experiment](#force-variant-calculation-before-rendering-experiment)
  - [Debugging](#debugging)
  - [Server Rendering](#server-rendering)
    - [Example](#example)
  - [With Babel](#with-babel)
- [Alternative Libraries](#alternative-libraries)
- [Resources for A/B Testing with React](#resources-for-ab-testing-with-react)
- [API Reference](#api-reference)
  - [`<Experiment />`](#experiment-)
  - [`<Variant />`](#variant-)
  - [`emitter`](#emitter)
    - [`emitter.emitWin(experimentName)`](#emitteremitwinexperimentname)
    - [`emitter.addActiveVariantListener([experimentName, ] callback)`](#emitteraddactivevariantlistenerexperimentname--callback)
    - [`emitter.addPlayListener([experimentName, ] callback)`](#emitteraddplaylistenerexperimentname--callback)
    - [`emitter.addWinListener([experimentName, ] callback)`](#emitteraddwinlistenerexperimentname--callback)
    - [`emitter.defineVariants(experimentName, variantNames [, variantWeights])`](#emitterdefinevariantsexperimentname-variantnames--variantweights)
    - [`emitter.setActiveVariant(experimentName, variantName)`](#emittersetactivevariantexperimentname-variantname)
    - [`emitter.getActiveVariant(experimentName)`](#emittergetactivevariantexperimentname)
    - [`emitter.calculateActiveVariant(experimentName [, userIdentifier, defaultVariantName])`](#emittercalculateactivevariantexperimentname--useridentifier-defaultvariantname)
    - [`emitter.getSortedVariants(experimentName)`](#emittergetsortedvariantsexperimentname)
    - [`emitter.setCustomDistributionAlgorithm(customAlgorithm)`](#emittersetcustomdistributionalgorithmcustomalgorithm)
  - [`Subscription`](#subscription)
    - [`subscription.remove()`](#subscriptionremove)
  - [`experimentDebugger`](#experimentdebugger)
    - [`experimentDebugger.setDebuggerAvailable(isAvailable)`](#experimentdebuggersetdebuggeravailableisavailable)
    - [`experimentDebugger.enable()`](#experimentdebuggerenable)
    - [`experimentDebugger.disable()`](#experimentdebuggerdisable)
  - [`mixpanelHelper`](#mixpanelhelper)
    - [Usage](#usage-1)
    - [`mixpanelHelper.enable()`](#mixpanelhelperenable)
    - [`mixpanelHelper.disable()`](#mixpanelhelperdisable)
  - [`segmentHelper`](#segmenthelper)
    - [Usage](#usage-2)
    - [`segmentHelper.enable()`](#segmenthelperenable)
    - [`segmentHelper.disable()`](#segmenthelperdisable)
- [How to contribute](#how-to-contribute)
  - [Requisites](#requisites)
  - [Running Tests](#running-tests)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

`react-ab-test` is compatible with React `>=0.14.x`

```bash
yarn add @juanu/react-ab-test
```

## Usage

### Standalone Component

Try it [on JSFiddle](https://jsfiddle.net/pushtell/m14qvy7r/)


Using useExperiment Hook

```js
import React from 'react';
import { useExperiment, emitter } from '@juanu/react-ab-test';

// Hook usage pattern requires registration of experiments
emitter.defineVariants("My Example", ["A", "B"]);

const App = () => {
  const { selectVariant, emitWin } = useExperiment("My Example");
  const variant = selectVariant({
    A: <div>Section A</div>,
    B: <div>Section B</div>
  });

  return (
    <div>
      {variant}
      <button onClick={emitWin}>CTA</button>
    </div>
  );
};
```


Using Experiment Component

```js
import React from 'react';
import { Experiment, Variant, emitter } from '@juanu/react-ab-test';

class App extends Component {
  experimentRef = React.createRef();

  onButtonClick(e) {
    this.experimentRef.current.win();
  }

  render() {
    return (
      <div>
        <Experiment ref={this.experimentRef} name="My Example">
          <Variant name="A">
            <div>Section A</div>
          </Variant>
          <Variant name="B">
            <div>Section B</div>
          </Variant>
        </Experiment>
        <button onClick={this.onButtonClick}>Emit a win</button>
      </div>
    );
  }
}

// Called when the experiment is displayed to the user.
emitter.addPlayListener(function(experimentName, variantName) {
  console.log(`Displaying experiment ${experimentName} variant ${variantName}`);
});

// Called when a 'win' is emitted, in this case by this.experimentRef.current.win()
emitter.addWinListener(function(experimentName, variantName) {
  console.log(
    `Variant ${variantName} of experiment ${experimentName} was clicked`
  );
});
```

### Coordinate Multiple Components

Try it [on JSFiddle](http://jsfiddle.net/pushtell/pcutps9q/)

```js
import React from 'react';
import { Experiment, Variant, emitter } from '@juanu/react-ab-test';

// Define variants in advance.
emitter.defineVariants('My Example', ['A', 'B', 'C']);

function Component1 = () => {
  return (
    <Experiment name="My Example">
      <Variant name="A">
        <div>Section A</div>
      </Variant>
      <Variant name="B">
        <div>Section B</div>
      </Variant>
    </Experiment>
  );
};

const Component2 = () => {
  return (
    <Experiment name="My Example">
      <Variant name="A">
        <div>Subsection A</div>
      </Variant>
      <Variant name="B">
        <div>Subsection B</div>
      </Variant>
      <Variant name="C">
        <div>Subsection C</div>
      </Variant>
    </Experiment>
  );
};

class Component3 extends React.Component {
  onButtonClick(e) {
    emitter.emitWin('My Example');
  }
  render() {
    return <button onClick={this.onButtonClick}>Emit a win</button>;
  }
}

const App = () => {
  return (
    <div>
      <Component1 />
      <Component2 />
      <Component3 />
    </div>
  );
};

// Called when the experiment is displayed to the user.
emitter.addPlayListener(function(experimentName, variantName) {
  console.log(`Displaying experiment ${experimentName} variant ${variantName}`);
});

// Called when a 'win' is emitted, in this case by emitter.emitWin('My Example')
emitter.addWinListener(function(experimentName, variantName) {
  console.log(
    `Variant ${variantName} of experiment ${experimentName} was clicked`
  );
});
```

### Weighting Variants

Try it [on JSFiddle](http://jsfiddle.net/pushtell/e2q7xe4f/)

Use [emitter.defineVariants()](#emitterdefinevariantsexperimentname-variantnames--variantweights) to optionally define the ratios by which variants are chosen.

```js
import React from 'react';
import { Experiment, Variant, emitter } from '@juanu/react-ab-test';

// Define variants and weights in advance.
emitter.defineVariants('My Example', ['A', 'B', 'C'], [10, 40, 40]);

const App = () => {
  return (
    <div>
      <Experiment name="My Example">
        <Variant name="A">
          <div>Section A</div>
        </Variant>
        <Variant name="B">
          <div>Section B</div>
        </Variant>
        <Variant name="C">
          <div>Section C</div>
        </Variant>
      </Experiment>
    </div>
  );
}
```

### Force variant calculation before rendering experiment
There are some scenarios where you may want the active variant of an experiment to be calculated before the experiment is rendered.
To do so, use [emitter.calculateActiveVariant()](#emittercalculateactivevariantexperimentname--useridentifier-defaultvariantname). Note that this method must
be called after [emitter.defineVariants()](#emitterdefinevariantsexperimentname-variantnames--variantweights)

```js
import { emitter } from '@juanu/react-ab-test';

// Define variants in advance
emitter.defineVariants('My Example', ['A', 'B', 'C']);
emitter.calculateActiveVariant('My Example', 'userId');

// Active variant will be defined even if the experiment is not rendered
const activeVariant = emitter.getActiveVariant('My Example');

```

### Debugging

The [debugger](#experimentdebugger) attaches a fixed-position panel to the bottom of the `<body>` element that displays mounted experiments and enables the user to change active variants in real-time.

The debugger is wrapped in a conditional `if(process.env.NODE_ENV === "production") {...}` and will not display on production builds using [envify](https://github.com/hughsk/envify).

<img src="https://cdn.rawgit.com/pushtell/react-ab-test/master/documentation-images/debugger-animated-2.gif" width="325" height="325" />

Try it [on JSFiddle](http://jsfiddle.net/pushtell/vs9kkxLd/)

```js
import React from 'react';
import { Experiment, Variant, experimentDebugger } from '@juanu/react-ab-test';

experimentDebugger.enable();

const App = () => {
  return (
    <div>
      <Experiment name="My Example">
        <Variant name="A">
          <div>Section A</div>
        </Variant>
        <Variant name="B">
          <div>Section B</div>
        </Variant>
      </Experiment>
    </div>
  );
}
````

### Server Rendering

A [`<Experiment />`](#experiment-) with a `userIdentifier` property will choose a consistent [`<Variant />`](#variant-) suitable for server side rendering.

See [`./examples/isomorphic`](https://github.com/pushtell/react-ab-test/tree/develop/examples/isomorphic) for a working example.

#### Example

The component in [`Component.jsx`](https://github.com/pushtell/react-ab-test/blob/master/examples/isomorphic/Component.jsx):

```js
var React = require('react');
var Experiment = require('react-ab-test/lib/Experiment');
var Variant = require('react-ab-test/lib/Variant');

module.exports = React.createClass({
  propTypes: {
    userIdentifier: React.PropTypes.string.isRequired,
  },
  render: function() {
    return (
      <div>
        <Experiment
          name="My Example"
          userIdentifier={this.props.userIdentifier}
        >
          <Variant name="A">
            <div>Section A</div>
          </Variant>
          <Variant name="B">
            <div>Section B</div>
          </Variant>
        </Experiment>
      </div>
    );
  },
});
```

We use a session ID for the `userIdentifier` property in this example, although a long-lived user ID would be preferable. See [`server.js`](https://github.com/pushtell/react-ab-test/blob/master/examples/isomorphic/server.js):

```js
require('babel/register')({ only: /jsx/ });

var express = require('express');
var session = require('express-session');
var React = require('react');
var ReactDOMServer = require('react-dom/server');
var Component = require('./Component.jsx');
var abEmitter = require('@juanu/react-ab-test/lib/emitter');

var app = express();

app.set('view engine', 'ejs');

app.use(
  session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
  })
);

app.get('/', function(req, res) {
  var reactElement = React.createElement(Component, {
    userIdentifier: req.sessionID,
  });
  var reactString = ReactDOMServer.renderToString(reactElement);
  abEmitter.rewind();
  res.render('template', {
    sessionID: req.sessionID,
    reactOutput: reactString,
  });
});

app.use(express.static('www'));

app.listen(8080);
```

Remember to call `abEmitter.rewind()` to prevent memory leaks.

An [EJS](https://github.com/mde/ejs) template in [`template.ejs`](https://github.com/pushtell/react-ab-test/blob/master/examples/isomorphic/views/template.ejs):

```html
<!doctype html>
<html>
  <head>
    <title>Isomorphic Rendering Example</title>
  </head>
  <script type="text/javascript">
    var SESSION_ID = <%- JSON.stringify(sessionID) %>;
  </script>
  <body>
    <div id="react-mount"><%- reactOutput %></div>
    <script type="text/javascript" src="bundle.js"></script>
  </body>
</html>
```

On the client in [`app.jsx`](https://github.com/pushtell/react-ab-test/blob/master/examples/isomorphic/www/app.jsx):

```js
var React = require('react');
var ReactDOM = require('react-dom');
var Component = require('../Component.jsx');

var container = document.getElementById('react-mount');

ReactDOM.render(<Component userIdentifier={SESSION_ID} />, container);
```

### With Babel

Code from [`./src`](https://github.com/pushtell/react-ab-test/tree/master/src) is written in [JSX](https://facebook.github.io/jsx/) and transpiled into [`./lib`](https://github.com/pushtell/react-ab-test/tree/master/lib) using [Babel](https://babeljs.io/). If your project uses Babel you may want to include files from [`./src`](https://github.com/pushtell/react-ab-test/tree/master/src) directly.

## Alternative Libraries

* [**react-experiments**](https://github.com/HubSpot/react-experiments) - “A JavaScript library that assists in defining and managing UI experiments in React” by [Hubspot](https://github.com/HubSpot). Uses Facebook's [PlanOut framework](http://facebook.github.io/planout/) via [Hubspot's javascript port](https://github.com/HubSpot/PlanOut.js).
* [**react-ab**](https://github.com/olahol/react-ab) - “Simple declarative and universal A/B testing component for React” by [Ola Holmström](https://github.com/olahol)
* [**react-native-ab**](https://github.com/lwansbrough/react-native-ab/) - “A component for rendering A/B tests in React Native” by [Loch Wansbrough](https://github.com/lwansbrough)

Please [let us know](https://github.com/pushtell/react-ab-test/issues/new) about alternate libraries not included here.

## Resources for A/B Testing with React

* [Product Experimentation with React and PlanOut](http://product.hubspot.com/blog/product-experimentation-with-planout-and-react.js) on the [HubSpot Product Blog](http://product.hubspot.com/)
* [Roll Your Own A/B Tests With Optimizely and React](http://engineering.tilt.com/roll-your-own-ab-tests-with-optimizely-and-react/) on the [Tilt Engineering Blog](http://engineering.tilt.com/)
* [Simple Sequential A/B Testing](http://www.evanmiller.org/sequential-ab-testing.html)
* [A/B Testing Rigorously (without losing your job)](http://elem.com/~btilly/ab-testing-multiple-looks/part1-rigorous.html)

Please [let us know](https://github.com/pushtell/react-ab-test/issues/new) about React A/B testing resources not included here.

## API Reference

### `<Experiment />`

Experiment container component. Children must be of type [`Variant`](#variant-).

* **Properties:**
  * `name` - Name of the experiment.
    * **Required**
    * **Type:** `string`
    * **Example:** `"My Example"`
  * `userIdentifier` - Distinct user identifier. When defined, this value is hashed to choose a variant if `defaultVariantName` or a stored value is not present. Useful for [server side rendering](#server-rendering).
    * **Optional**
    * **Type:** `string`
    * **Example:** `"7cf61a4521f24507936a8977e1eee2d4"`
  * `defaultVariantName` - Name of the default variant. When defined, this value is used to choose a variant if a stored value is not present. This property may be useful for [server side rendering](#server-rendering) but is otherwise not recommended.
    * **Optional**
    * **Type:** `string`
    * **Example:** `"A"`

### `<Variant />`

Variant container component.

* **Properties:**
  * `name` - Name of the variant.
    * **Required**
    * **Type:** `string`
    * **Example:** `"A"`

### `emitter`

Event emitter responsible for coordinating and reporting usage. Extended from [facebook/emitter](https://github.com/facebook/emitter).

#### `emitter.emitWin(experimentName)`

Emit a win event.

* **Return Type:** No return value
* **Parameters:**
  * `experimentName` - Name of an experiment.
    * **Required**
    * **Type:** `string`
    * **Example:** `"My Example"`

#### `emitter.addActiveVariantListener([experimentName, ] callback)`

Listen for the active variant specified by an experiment.

* **Return Type:** [`Subscription`](#subscription)
* **Parameters:**
  * `experimentName` - Name of an experiment. If provided, the callback will only be called for the specified experiment.
    * **Optional**
    * **Type:** `string`
    * **Example:** `"My Example"`
  * `callback` - Function to be called when a variant is chosen.
    * **Required**
    * **Type:** `function`
    * **Callback Arguments:**
      * `experimentName` - Name of the experiment.
        * **Type:** `string`
      * `variantName` - Name of the variant.
        * **Type:** `string`

#### `emitter.addPlayListener([experimentName, ] callback)`

Listen for an experiment being displayed to the user. Trigged by the [React componentWillMount lifecycle method](https://facebook.github.io/react/docs/component-specs.html#mounting-componentwillmount).

* **Return Type:** [`Subscription`](#subscription)
* **Parameters:**
  * `experimentName` - Name of an experiment. If provided, the callback will only be called for the specified experiment.
    * **Optional**
    * **Type:** `string`
    * **Example:** `"My Example"`
  * `callback` - Function to be called when an experiment is displayed to the user.
    * **Required**
    * **Type:** `function`
    * **Callback Arguments:**
      * `experimentName` - Name of the experiment.
        * **Type:** `string`
      * `variantName` - Name of the variant.
        * **Type:** `string`

#### `emitter.addWinListener([experimentName, ] callback)`

Listen for a successful outcome from the experiment. Trigged by the [emitter.emitWin(experimentName)](#emitteremitwinexperimentname) method.

* **Return Type:** [`Subscription`](#subscription)
* **Parameters:**
  * `experimentName` - Name of an experiment. If provided, the callback will only be called for the specified experiment.
    * **Optional**
    * **Type:** `string`
    * **Example:** `"My Example"`
  * `callback` - Function to be called when a win is emitted.
    * **Required**
    * **Type:** `function`
    * **Callback Arguments:**
      * `experimentName` - Name of the experiment.
        * **Type:** `string`
      * `variantName` - Name of the variant.
        * **Type:** `string`

#### `emitter.defineVariants(experimentName, variantNames [, variantWeights])`

Define experiment variant names and weighting. Required when an experiment [spans multiple components](#coordinate-multiple-components) containing different sets of variants.

If `variantWeights` are not specified variants will be chosen at equal rates.

The variants will be chosen according to the ratio of the numbers, for example variants `["A", "B", "C"]` with weights `[20, 40, 40]` will be chosen 20%, 40%, and 40% of the time, respectively.

* **Return Type:** No return value
* **Parameters:**
  * `experimentName` - Name of the experiment.
    * **Required**
    * **Type:** `string`
    * **Example:** `"My Example"`
  * `variantNames` - Array of variant names.
    * **Required**
    * **Type:** `Array.<string>`
    * **Example:** `["A", "B", "C"]`
  * `variantWeights` - Array of variant weights.
    * **Optional**
    * **Type:** `Array.<number>`
    * **Example:** `[20, 40, 40]`

#### `emitter.setActiveVariant(experimentName, variantName)`

Set the active variant of an experiment.

* **Return Type:** No return value
* **Parameters:**
  * `experimentName` - Name of the experiment.
    * **Required**
    * **Type:** `string`
    * **Example:** `"My Example"`
  * `variantName` - Name of the variant.
    * **Required**
    * **Type:** `string`
    * **Example:** `"A"`

#### `emitter.getActiveVariant(experimentName)`

Returns the variant name currently displayed by the experiment.

* **Return Type:** `string`
* **Parameters:**
  * `experimentName` - Name of the experiment.
    * **Required**
    * **Type:** `string`
    * **Example:** `"My Example"`

#### `emitter.calculateActiveVariant(experimentName [, userIdentifier, defaultVariantName])`

Force calculation of active variant, even if the experiment is not displayed yet.
Note: This method must be called after `emitter.defineVariants`

* **Return Type:** `string`
* **Parameters:**
  * `experimentName` - Name of the experiment.
    * **Required**
    * **Type:** `string`
    * **Example:** `"My Example"`
  * `userIdentifier` - Distinct user identifier. When defined, this value is hashed to choose a variant if `defaultVariantName` or a stored value is not present. Useful for [server side rendering](#server-rendering).
    * **Optional**
    * **Type:** `string`
    * **Example:** `"7cf61a4521f24507936a8977e1eee2d4"`
  * `defaultVariantName` - Name of the default variant. When defined, this value is used to choose a variant if a stored value is not present. This property may be useful for [server side rendering](#server-rendering) but is otherwise not recommended.
    * **Optional**
    * **Type:** `string`
    * **Example:** `"A"`

#### `emitter.getSortedVariants(experimentName)`

Returns a sorted array of variant names associated with the experiment.

* **Return Type:** `Array.<string>`
* **Parameters:**
  * `experimentName` - Name of the experiment.
    * **Required**
    * **Type:** `string`
    * **Example:** `"My Example"`

#### `emitter.setCustomDistributionAlgorithm(customAlgorithm)`

Sets a custom function to use for calculating variants overriding the default. This can be usefull
in cases when variants are expected from 3rd parties or when variants need to be
in sync with other clients using ab test but different distribution algorithm.

- **Return Type:** No return value
- **Parameters:**
  - `customAlgorithm` - Function for calculating variant distribution.
    - **Required**
    - **Type:** `function`
    - **Callback Arguments:**
      - `experimentName` - Name of the experiment.
        - **Required**
        - **Type:** `string`
      - `userIdentifier` - User's value which is used to calculate the variant
        - **Required**
        - **Type:** `string`
      - `defaultVariantName` - Default variant passed from the experiment
        - **Type:** `string`

### `Subscription`

Returned by the emitter's add listener methods. More information available in the [facebook/emitter documentation.](https://github.com/facebook/emitter#api-concepts)

#### `subscription.remove()`

Removes the listener subscription and prevents future callbacks.

* **Parameters:** No parameters

### `experimentDebugger`

Debugging tool. Attaches a fixed-position panel to the bottom of the `<body>` element that displays mounted experiments and enables the user to change active variants in real-time.

The debugger is wrapped in a conditional `if(process.env.NODE_ENV === "production") {...}` and will not display on production builds using [envify](https://github.com/hughsk/envify). This can be overriden by `setDebuggerAvailable`

<img src="https://cdn.rawgit.com/pushtell/react-ab-test/master/documentation-images/debugger-animated-2.gif" width="325" height="325" />

#### `experimentDebugger.setDebuggerAvailable(isAvailable)`
Overrides `process.env.NODE_ENV` check, so it can be decided if the debugger is available
or not at runtime. This allow, for instance, to enable the debugger in a testing environment but not in production.
Note that you require to explicitly call to `.enable` even if you forced this to be truthy.

* **Return Type:** No return value
* **Parameters:**
  * `isAvailable` - Tells whether the debugger is available or not
    * **Required**
    * **Type:** `boolean`

#### `experimentDebugger.enable()`

Attaches the debugging panel to the `<body>` element.

* **Return Type:** No return value

#### `experimentDebugger.disable()`

Removes the debugging panel from the `<body>` element.

* **Return Type:** No return value

### `mixpanelHelper`

Sends events to [Mixpanel](https://mixpanel.com). Requires `window.mixpanel` to be set using [Mixpanel's embed snippet](https://mixpanel.com/help/reference/javascript).

#### Usage

When the [`<Experiment />`](#experiment-) is mounted, the helper sends an `Experiment Play` event using [`mixpanel.track(...)`](https://mixpanel.com/help/reference/javascript-full-api-reference#mixpanel.track) with `Experiment` and `Variant` properties.

When a [win is emitted](#emitteremitwinexperimentname) the helper sends an `Experiment Win` event using [`mixpanel.track(...)`](https://mixpanel.com/help/reference/javascript-full-api-reference#mixpanel.track) with `Experiment` and `Variant` properties.

Try it [on JSFiddle](https://jsfiddle.net/pushtell/hwtnzm35/)

```js
import React from 'react';
import { Experiment, Variant, mixpanelHelper } from '@juanu/react-ab-test';

// window.mixpanel has been set by Mixpanel's embed snippet.
mixpanelHelper.enable();

class App extends React.Component {

  experimentRef = React.createRef();

  onButtonClick(e) {
    this.experimentRef.current.win();
    // mixpanelHelper sends the 'Experiment Win' event, equivalent to:
    // mixpanel.track('Experiment Win', {Experiment: "My Example", Variant: "A"})
  }
  componentWillMount() {
    // mixpanelHelper sends the 'Experiment Play' event, equivalent to:
    // mixpanel.track('Experiment Play', {Experiment: "My Example", Variant: "A"})
  }
  render() {
    return (
      <div>
        <Experiment ref={this.experimentRef} name="My Example">
          <Variant name="A">
            <div>Section A</div>
          </Variant>
          <Variant name="B">
            <div>Section B</div>
          </Variant>
        </Experiment>
        <button onClick={this.onButtonClick}>Emit a win</button>
      </div>
    );
  }
}
```

#### `mixpanelHelper.enable()`

Add listeners to `win` and `play` events and report results to Mixpanel.

* **Return Type:** No return value

#### `mixpanelHelper.disable()`

Remove `win` and `play` listeners and stop reporting results to Mixpanel.

* **Return Type:** No return value

### `segmentHelper`

Sends events to [Segment](https://segment.com). Requires `window.analytics` to be set using [Segment's embed snippet](https://segment.com/docs/libraries/analytics.js/quickstart/#step-1-copy-the-snippet).

#### Usage

When the [`<Experiment />`](#experiment-) is mounted, the helper sends an `Experiment Viewed` event using [`segment.track(...)`](https://segment.com/docs/libraries/analytics.js/#track) with `experimentName` and `variationName` properties.

When a [win is emitted](#emitteremitwinexperimentname) the helper sends an `Experiment Won` event using [`segment.track(...)`](https://segment.com/docs/libraries/analytics.js/#track) with `experimentName` and `variationName` properties.

Try it [on JSFiddle](https://jsfiddle.net/pushtell/ae1jeo2k/)

```js
import React from 'react';
import { Experiment, Variant, segmentHelper } from '@juanu/react-ab-test';

// window.analytics has been set by Segment's embed snippet.
segmentHelper.enable();

class App extends React.Component {
  experimentRef = React.createRef();

  onButtonClick(e) {
    this.experimentRef.current.win();
    // segmentHelper sends the 'Experiment Won' event, equivalent to:
    // segment.track('Experiment Won', {experimentName: "My Example", variationName: "A"})
  }
  componentWillMount() {
    // segmentHelper sends the 'Experiment Viewed' event, equivalent to:
    // segment.track('Experiment Viewed, {experimentName: "My Example", variationName: "A"})
  }
  render() {
    return (
      <div>
        <Experiment ref={this.experimentRef} name="My Example">
          <Variant name="A">
            <div>Section A</div>
          </Variant>
          <Variant name="B">
            <div>Section B</div>
          </Variant>
        </Experiment>
        <button onClick={this.onButtonClick}>Emit a win</button>
      </div>
    );
  }
}
```

#### `segmentHelper.enable()`

Add listeners to `win` and `play` events and report results to Segment.

* **Return Type:** No return value

#### `segmentHelper.disable()`

Remove `win` and `play` listeners and stop reporting results to Segment.

* **Return Type:** No return value

## How to contribute

### Requisites

Before contribuiting you need:

* [doctoc](https://github.com/thlorenz/doctoc) installed

Then you can:

* Apply your changes :sunglasses:
* Build your changes with `yarn build`
* Test your changes with `yarn test`
* Lint your changes with `yarn lint`
* And finally open the PR! :tada:

### Running Tests

```bash
yarn test
```
