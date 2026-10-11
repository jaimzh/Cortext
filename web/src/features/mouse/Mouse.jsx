import { useEffect, useRef, useState } from 'react';
import { GearSixIcon, PlusIcon, MinusIcon, CaretDownIcon } from '@phosphor-icons/react';
import { useMouse } from './useMouse.js';
import './Mouse.css';

const SLIDER_STORAGE_KEY = 'cortext.mouseSliders';
function loadSliderOptions() {
  try {
    const stored = JSON.parse(localStorage.getItem(SLIDER_STORAGE_KEY));
    return {
      zoom: typeof stored?.zoom === 'boolean' ? stored.zoom : true,
      scroll: typeof stored?.scroll === 'boolean' ? stored.scroll : true,
      // Always use keyboard zoom, including devices with a saved wheel preference.
      zoomMethod: 'shortcuts',
      zoomMethodVersion: 1,
    };
  } catch {
    return { zoom: true, scroll: true, zoomMethod: 'shortcuts', zoomMethodVersion: 1 };
  }
}

export default function Mouse({ api, report, active = true, onHapticPress }) {
  const panelRef = useRef(null);
  const settingsRef = useRef(null);
  const settingsButtonRef = useRef(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const slidersRef = useRef(null);
  const slidersButtonRef = useRef(null);
  const [slidersOpen, setSlidersOpen] = useState(false);
  const [sliderOptions, setSliderOptions] = useState(loadSliderOptions);
  useMouse(panelRef, api, report, active, sliderOptions, onHapticPress);
  useEffect(() => {
    try {
      localStorage.setItem(SLIDER_STORAGE_KEY, JSON.stringify(sliderOptions));
    } catch {}
  }, [sliderOptions]);
  useEffect(() => {
    if (!slidersOpen) return;
    function dismiss(event) {
      if (!slidersRef.current.contains(event.target)) setSlidersOpen(false);
    }
    function escape(event) {
      if (event.key !== 'Escape') return;
      setSlidersOpen(false);
      slidersButtonRef.current.focus();
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [slidersOpen]);
  useEffect(() => {
    if (!active) {
      setSettingsOpen(false);
      setSlidersOpen(false);
    }
  }, [active]);
  useEffect(() => {
    if (!settingsOpen) return;
    function dismiss(event) {
      if (!settingsRef.current.contains(event.target)) setSettingsOpen(false);
    }
    function escape(event) {
      if (event.key !== 'Escape') return;
      setSettingsOpen(false);
      settingsButtonRef.current.focus();
    }
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [settingsOpen]);

  async function stepZoom(direction) {
    if (!active || !sliderOptions.zoom) return;
    try {
      await api.sendMouseZoom(direction, sliderOptions.zoomMethod);
    } catch (error) {
      report('Zoom failed.', error.message);
    }
  }

  return (
    <section ref={panelRef} id="trackpadPanel" className="panel" aria-label="Mouse">
      <div
        className="trackpad-wrap"
        data-zoom={sliderOptions.zoom}
        data-scroll={sliderOptions.scroll}
      >
        <div
          className="trackpad-zoom-bar"
          hidden={!sliderOptions.zoom}
          title="Hold up to zoom in or down to zoom out. Farther from center zooms faster; release to stop."
        >
          <button
            className="trackpad-zoom-button zoom-in-button"
            type="button"
            aria-label="Zoom in"
            title="Zoom in one step"
            disabled={!active || !sliderOptions.zoom}
            onClick={() => stepZoom(1)}
          >
            <PlusIcon size={16} aria-hidden="true" />
          </button>
          <input
            id="trackpadZoomSlider"
            aria-label="Zoom"
            aria-orientation="vertical"
            type="range"
            min="-10"
            max="10"
            step="1"
            defaultValue="0"
            disabled={!sliderOptions.zoom}
          />
          <button
            className="trackpad-zoom-button zoom-out-button"
            type="button"
            aria-label="Zoom out"
            title="Zoom out one step"
            disabled={!active || !sliderOptions.zoom}
            onClick={() => stepZoom(-1)}
          >
            <MinusIcon size={16} aria-hidden="true" />
          </button>
        </div>
        <div id="trackpadPad" className="trackpad-pad" role="application" aria-label="Trackpad">
          <div className="trackpad-hint">
            Move with one finger
            <br />
            Double-tap to click &middot; triple-tap to double-click
            <br />
            Double-tap and drag to move things
            <br />
            Two fingers to scroll
          </div>
        </div>
        <div
          id="trackpadScrollBar"
          className="trackpad-scroll-bar"
          role="application"
          aria-label="Touch scroll bar"
          hidden={!sliderOptions.scroll}
        >
          <div className="scroll-edge top" aria-hidden="true"></div>
          <div className="scroll-thumb" aria-hidden="true"></div>
          <div className="scroll-edge bottom" aria-hidden="true"></div>
        </div>
      </div>
      <div className="trackpad-actions">
        <div ref={slidersRef} className="trackpad-slider-options">
          <button
            ref={slidersButtonRef}
            className="trackpad-sliders-button"
            type="button"
            aria-label="Slider options"
            title="Slider options"
            aria-expanded={slidersOpen}
            aria-controls="mouseSliderOptions"
            onClick={() => {
              setSlidersOpen((value) => !value);
              setSettingsOpen(false);
            }}
          >
            <CaretDownIcon size={18} aria-hidden="true" />
          </button>
          <div
            id="mouseSliderOptions"
            className="trackpad-sliders-popover"
            role="group"
            aria-label="Sliders"
            hidden={!slidersOpen}
          >
            <label>
              <input
                type="checkbox"
                checked={sliderOptions.zoom}
                onChange={(event) =>
                  setSliderOptions((current) => ({ ...current, zoom: event.target.checked }))
                }
              />
              Zoom slider
            </label>
            <label>
              <input
                type="checkbox"
                checked={sliderOptions.scroll}
                onChange={(event) =>
                  setSliderOptions((current) => ({ ...current, scroll: event.target.checked }))
                }
              />
              Scroll slider
            </label>
          </div>
        </div>
        <div className="trackpad-buttons" aria-label="Mouse buttons">
          <button className="shortcut-button" type="button" data-click="left">
            <span className="button-label">Left</span>
          </button>
          <button className="shortcut-button" type="button" data-click="right">
            <span className="button-label">Right</span>
          </button>
        </div>
        <div ref={settingsRef} className="trackpad-settings">
          <button
            ref={settingsButtonRef}
            className="trackpad-settings-button"
            type="button"
            aria-label="Mouse settings"
            title="Mouse settings"
            aria-expanded={settingsOpen}
            aria-controls="mouseSensitivitySettings"
            onClick={() => {
              setSettingsOpen((value) => !value);
              setSlidersOpen(false);
            }}
          >
            <GearSixIcon size={20} aria-hidden="true" />
          </button>
          <div
            id="mouseSensitivitySettings"
            className="trackpad-settings-popover"
            hidden={!settingsOpen}
          >
            <label htmlFor="sensitivitySlider">
              Sensitivity
              <output id="sensitivityValue">1.8x</output>
            </label>
            <input
              id="sensitivitySlider"
              aria-label="Sensitivity"
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              defaultValue="1.8"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
