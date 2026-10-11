export function initController(elements, api) {
  const events = new AbortController();
  let disposed = false;
  function listen(target, type, handler, options = {}) {
    target.addEventListener(type, handler, { ...options, signal: events.signal });
  }
  const { controllerPanel, controllerButtons, controllerSticks, statusText, onHapticPress } =
    elements;

  const activePointers = new Map();
  const activeControls = new Set();
  const stickTaps = new Map();
  const heldButtons = new Map();

  // Separate buttons and double-tap gestures can hold the same Xbox button.
  function pressGamepadButton(button) {
    const count = heldButtons.get(button) || 0;
    heldButtons.set(button, count + 1);
    if (!count) sendGamepadEvent({ type: 'gamepad.button', button, action: 'down' });
  }

  function releaseGamepadButton(button) {
    const count = heldButtons.get(button) || 0;
    if (count > 1) heldButtons.set(button, count - 1);
    else if (count === 1) {
      heldButtons.delete(button);
      sendGamepadEvent({ type: 'gamepad.button', button, action: 'up' });
    }
  }

  function releaseStickClick(control) {
    if (!control.stickClicked) return;
    control.stickClicked = false;
    control.stick.classList.remove('stick-clicked');
    releaseGamepadButton(`${control.stick.dataset.gamepadStick}_stick`);
  }

  const removeMessage = api.onControllerMessage?.((message) => {
    if (message.type === 'gamepad.status') {
      statusText.textContent = message.message || 'Native Xbox controller ready';
    } else if (message.type === 'error') {
      statusText.textContent = message.message || 'Controller error';
    }
  });

  const removeOpen = api.onControllerOpen?.(() => {
    sendGamepadEvent({ type: 'gamepad.connect' });
  });

  function sendGamepadEvent(event) {
    const sent = api.sendControllerEvent({
      ...event,
    });

    if (!sent) {
      statusText.textContent = 'Controller reconnecting...';
    }
  }

  function updateTrigger(control, value) {
    value = Math.round(Math.max(0, Math.min(1, value)) * 1000) / 1000;
    if (control.value === value) return;
    control.value = value;
    control.button.style.setProperty('--trigger-pressure', `${value * 100}%`);
    sendGamepadEvent({ type: 'gamepad.trigger', side: control.trigger, value });
  }

  function stopTriggerHold(control) {
    clearTimeout(control.holdTimer);
    control.holdTimer = null;
  }

  function startTriggerHold(control) {
    const started = Date.now();
    function tick() {
      if (disposed || control.sliding || !activeControls.has(control.controlId)) return;
      const elapsed = Date.now() - started;
      updateTrigger(control, 0.15 + (0.85 * elapsed) / 500);
      if (elapsed < 500) control.holdTimer = setTimeout(tick, Math.min(40, 500 - elapsed));
      else control.holdTimer = null;
    }
    control.holdTimer = setTimeout(tick, 40);
  }

  function pressControl(button, event) {
    const pointerId = event.pointerId;
    const gamepadButton = button.dataset.gamepadButton;
    const trigger = button.dataset.gamepadTrigger;
    const keyboardKey = button.dataset.keyboardKey;
    const controlId = keyboardKey
      ? `key:${keyboardKey}`
      : gamepadButton
        ? `button:${gamepadButton}`
        : `trigger:${trigger}`;

    if (activeControls.has(controlId)) {
      return;
    }

    const control = {
      button,
      gamepadButton,
      trigger,
      controlId,
      startX: event.clientX,
      startY: event.clientY,
      rotation: Number(getComputedStyle(button).getPropertyValue('--controller-rotation')),
    };
    activePointers.set(pointerId, control);
    activeControls.add(controlId);
    button.classList.add('pressed');
    onHapticPress?.();

    if (gamepadButton) {
      pressGamepadButton(gamepadButton);
    } else if (trigger) {
      updateTrigger(control, 0.15);
      startTriggerHold(control);
    } else if (keyboardKey) {
      api.sendKeyboardKey(keyboardKey).catch((error) => {
        if (!disposed) statusText.textContent = `Key press failed: ${error.message}`;
      });
    }

    statusText.textContent = 'Controller';
  }

  function releaseControl(pointerId) {
    const control = activePointers.get(pointerId);

    if (!control) {
      return;
    }

    activePointers.delete(pointerId);
    activeControls.delete(control.controlId);
    control.button.classList.remove('pressed');

    if (control.gamepadButton) {
      releaseGamepadButton(control.gamepadButton);
    } else if (control.trigger) {
      stopTriggerHold(control);
      updateTrigger(control, 0);
    }
  }

  function releaseAll() {
    activePointers.forEach((control) => {
      releaseStickClick(control);
      if (control.gamepadButton) {
        releaseGamepadButton(control.gamepadButton);
      } else if (control.trigger) {
        stopTriggerHold(control);
        updateTrigger(control, 0);
      }
    });

    controllerSticks.forEach((stick) => {
      updateStick(stick, 0, 0);
      stick.classList.remove('pressed');
    });

    activePointers.clear();
    stickTaps.clear();
    activeControls.clear();
    controllerButtons.forEach((button) => button.classList.remove('pressed'));
  }

  listen(controllerPanel, 'controller:edit', releaseAll);

  function updateStick(stick, x, y) {
    const knob = stick.querySelector('.stick-knob');

    if (knob) {
      knob.style.transform = `translate(calc(-50% + ${x * 34}px), calc(-50% + ${-y * 34}px))`;
    }

    sendGamepadEvent({
      type: 'gamepad.stick',
      side: stick.dataset.gamepadStick,
      x,
      y,
    });
  }

  function moveStick(stick, event) {
    const rect = stick.getBoundingClientRect();
    const radius = Math.min(rect.width, rect.height) / 2;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Map screen coordinates back into the controller's rotated surface.
    const angle =
      (Number(getComputedStyle(stick).getPropertyValue('--controller-rotation')) * Math.PI) / 180;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const rawX = (dx * Math.cos(angle) + dy * Math.sin(angle)) / radius;
    const rawY = (dx * Math.sin(angle) - dy * Math.cos(angle)) / radius;
    const distance = Math.hypot(rawX, rawY);
    const scale = distance > 1 ? 1 / distance : 1;

    updateStick(stick, rawX * scale, rawY * scale);
  }

  controllerButtons.forEach((button) => {
    listen(button, 'pointerdown', (event) => {
      if (controllerPanel.dataset.editing === 'true' || button.closest('[hidden]')) return;
      event.preventDefault();

      try {
        button.setPointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture is best-effort on mobile browsers.
      }

      pressControl(button, event);
    });

    listen(button, 'pointermove', (event) => {
      if (controllerPanel.dataset.editing === 'true') return;
      const control = activePointers.get(event.pointerId);
      if (!control?.trigger || control.button !== button) return;
      event.preventDefault();
      const angle = (control.rotation * Math.PI) / 180;
      const distance =
        (event.clientY - control.startY) * Math.cos(angle) -
        (event.clientX - control.startX) * Math.sin(angle);
      if (!control.sliding) {
        // Small touch jitter should not cancel a stationary hold.
        if (Math.abs(distance) < 4) return;
        control.sliding = true;
        control.slideStartValue = control.value;
        stopTriggerHold(control);
      }
      updateTrigger(control, control.slideStartValue + distance / 80);
    });

    listen(button, 'pointerup', (event) => {
      event.preventDefault();
      releaseControl(event.pointerId);
    });

    listen(button, 'pointercancel', (event) => {
      releaseControl(event.pointerId);
    });

    listen(button, 'lostpointercapture', (event) => releaseControl(event.pointerId));

    listen(button, 'contextmenu', (event) => {
      event.preventDefault();
    });
  });

  controllerSticks.forEach((stick) => {
    listen(stick, 'pointerdown', (event) => {
      if (controllerPanel.dataset.editing === 'true' || stick.closest('[hidden]')) return;
      if ([...activePointers.values()].some((control) => control.stick === stick)) return;
      event.preventDefault();

      try {
        stick.setPointerCapture(event.pointerId);
      } catch (error) {
        // Pointer capture is best-effort on mobile browsers.
      }

      const tap = stickTaps.get(stick);
      const stickClicked = Boolean(
        tap &&
        Date.now() - tap.time <= 300 &&
        Math.hypot(event.clientX - tap.x, event.clientY - tap.y) <= 24,
      );
      stickTaps.delete(stick);
      activePointers.set(event.pointerId, {
        stick,
        stickClicked,
        started: Date.now(),
        startX: event.clientX,
        startY: event.clientY,
        moved: false,
      });
      stick.classList.add('pressed');
      if (stickClicked) {
        stick.classList.add('stick-clicked');
        pressGamepadButton(`${stick.dataset.gamepadStick}_stick`);
      }
      onHapticPress?.();
      moveStick(stick, event);
      statusText.textContent = 'Controller';
    });

    listen(stick, 'pointermove', (event) => {
      if (controllerPanel.dataset.editing === 'true') return;
      event.preventDefault();

      const control = activePointers.get(event.pointerId);

      if (control?.stick !== stick) {
        return;
      }

      if (Math.hypot(event.clientX - control.startX, event.clientY - control.startY) > 10)
        control.moved = true;
      moveStick(stick, event);
    });

    function releaseStick(event) {
      const control = activePointers.get(event.pointerId);

      if (control?.stick !== stick) {
        return;
      }

      activePointers.delete(event.pointerId);
      const distance = Math.hypot(event.clientX - control.startX, event.clientY - control.startY);
      if (
        event.type === 'pointerup' &&
        !control.stickClicked &&
        !control.moved &&
        distance <= 10 &&
        Date.now() - control.started <= 250
      ) {
        stickTaps.set(stick, { time: Date.now(), x: control.startX, y: control.startY });
      } else stickTaps.delete(stick);
      releaseStickClick(control);
      stick.classList.remove('pressed');
      updateStick(stick, 0, 0);
    }

    listen(stick, 'pointerup', (event) => {
      event.preventDefault();
      releaseStick(event);
    });

    listen(stick, 'pointercancel', releaseStick);
    listen(stick, 'lostpointercapture', releaseStick);
    listen(stick, 'contextmenu', (event) => {
      event.preventDefault();
    });
  });

  listen(window, 'blur', releaseAll);
  listen(document, 'visibilitychange', () => {
    if (document.hidden) {
      releaseAll();
    } else {
      sendGamepadEvent({ type: 'gamepad.connect' });
    }
  });

  sendGamepadEvent({ type: 'gamepad.connect' });

  function preventGameplayTouch(event) {
    if (controllerPanel.dataset.editing !== 'true' && event.target.closest('.controller-shell'))
      event.preventDefault();
  }
  listen(controllerPanel, 'touchstart', preventGameplayTouch, { passive: false });
  listen(controllerPanel, 'touchmove', preventGameplayTouch, { passive: false });

  ['gesturestart', 'gesturechange', 'gestureend'].forEach((eventName) => {
    listen(controllerPanel, eventName, (event) => event.preventDefault());
  });

  return () => {
    releaseAll();
    events.abort();
    removeMessage?.();
    removeOpen?.();
    disposed = true;
  };
}
