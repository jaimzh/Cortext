import { useEffect } from 'react';
import { initTrackpad } from './trackpadEngine.js';

export function useMouse(panelRef, api, report, active, sliderOptions, onHapticPress) {
  useEffect(() => {
    if (!active) return;
    const panel = panelRef.current;
    return initTrackpad(
      {
        trackpadPad: panel.querySelector('#trackpadPad'),
        trackpadScrollBar: sliderOptions.scroll ? panel.querySelector('#trackpadScrollBar') : null,
        trackpadZoomSlider: sliderOptions.zoom ? panel.querySelector('#trackpadZoomSlider') : null,
        zoomMethod: sliderOptions.zoomMethod,
        sensitivitySlider: panel.querySelector('#sensitivitySlider'),
        sensitivityValue: panel.querySelector('#sensitivityValue'),
        mouseButtons: panel.querySelectorAll('[data-click]'),
        onHapticPress,
        statusText: {
          set textContent(message) {
            report(message);
          },
        },
      },
      api,
    );
  }, [panelRef, api, report, active, sliderOptions, onHapticPress]);
}
