import emitter from '../emitter';

let enabled = false;
let playSubscription = null;
let winSubscription = null;

export default {
  enable() {
    if (enabled) {
      return;
    }

    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';

    if (isBrowser) {
      if (!window.mixpanel) {
        const error = new Error(
          "React A/B Test Mixpanel Helper: 'mixpanel' global is not defined."
        );
        error.type = 'PUSHTELL_HELPER_MISSING_GLOBAL';
        throw error;
      }
    } else {
      // If not in browser, just enable without functionality
      enabled = true;
      return;
    }

    playSubscription = emitter.addPlayListener(function (
      experimentName,
      variantName
    ) {
      window.mixpanel.track('Experiment Viewed', {
        experimentName: experimentName,
        variationName: variantName,
      });
    });

    winSubscription = emitter.addWinListener(function (
      experimentName,
      variantName
    ) {
      window.mixpanel.track('Experiment Won', {
        experimentName: experimentName,
        variationName: variantName,
      });
    });

    enabled = true;
  },

  disable() {
    if (!enabled) {
      const error = new Error(
        'React A/B Test Mixpanel Helper: Helper was disabled without being enabled first.'
      );
      error.type = 'PUSHTELL_HELPER_INVALID_DISABLE';
      throw error;
    }

    if (playSubscription) {
      playSubscription.remove();
      playSubscription = null;
    }

    if (winSubscription) {
      winSubscription.remove();
      winSubscription = null;
    }

    enabled = false;
  },
};
