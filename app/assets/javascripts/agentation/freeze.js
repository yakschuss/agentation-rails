// freeze.js — Deep animation/timer freeze.
// Monkey-patches setTimeout, setInterval, rAF when frozen.
// Excludes agentation UI elements.

var AgentationFreeze = (function() {
  // Store original functions
  var _setTimeout = window.setTimeout.bind(window);
  var _clearTimeout = window.clearTimeout.bind(window);
  var _setInterval = window.setInterval.bind(window);
  var _clearInterval = window.clearInterval.bind(window);
  var _requestAnimationFrame = window.requestAnimationFrame.bind(window);
  var _cancelAnimationFrame = window.cancelAnimationFrame.bind(window);

  // State (on window to survive hot reloads)
  if (!window.__agentation_freeze) {
    window.__agentation_freeze = {
      frozen: false,
      queuedTimeouts: [],
      queuedRAFs: [],
      pausedIntervals: [],
      freezeStyleId: "agentation-freeze-styles",
      pausedAnimations: [],
      pausedVideos: []
    };
  }

  var state = window.__agentation_freeze;

  // Freeze CSS
  var FREEZE_CSS = "\n    *:not([data-agentation-toolbar] *):not([data-agentation-marker]):not(.ag-popup):not(.ag-popup *):not(.ag-overlay):not(.ag-flash):not(.ag-text-bubble) {\n      animation-play-state: paused !important;\n      transition-duration: 0s !important;\n      transition-delay: 0s !important;\n    }\n  ";

  function freeze() {
    if (state.frozen) return;
    state.frozen = true;

    // 1. Inject freeze CSS
    if (!document.getElementById(state.freezeStyleId)) {
      var style = document.createElement("style");
      style.id = state.freezeStyleId;
      style.textContent = FREEZE_CSS;
      document.head.appendChild(style);
    }

    // 2. Monkey-patch setTimeout
    window.setTimeout = function(fn, delay) {
      if (state.frozen && typeof fn === "function") {
        var entry = { fn: fn, delay: delay || 0, id: Math.random() };
        state.queuedTimeouts.push(entry);
        return entry.id;
      }
      return _setTimeout(fn, delay);
    };

    // 3. Monkey-patch setInterval — suppress callbacks
    window.setInterval = function(fn, interval) {
      if (state.frozen) {
        var entry = { fn: fn, interval: interval, id: Math.random() };
        state.pausedIntervals.push(entry);
        return entry.id;
      }
      return _setInterval(fn, interval);
    };

    // 4. Monkey-patch requestAnimationFrame
    window.requestAnimationFrame = function(fn) {
      if (state.frozen) {
        var entry = { fn: fn, id: Math.random() };
        state.queuedRAFs.push(entry);
        return entry.id;
      }
      return _requestAnimationFrame(fn);
    };

    // 5. Pause WAAPI animations
    try {
      var animations = document.getAnimations ? document.getAnimations() : [];
      state.pausedAnimations = animations.filter(function(anim) {
        var target = anim.effect && anim.effect.target;
        if (target && isAgentationElement(target)) return false;
        return anim.playState === "running";
      });
      state.pausedAnimations.forEach(function(anim) {
        try { anim.pause(); } catch(e) { /* */ }
      });
    } catch(e) { /* WAAPI not supported */ }

    // 6. Pause videos
    state.pausedVideos = [];
    var videos = document.querySelectorAll("video");
    for (var i = 0; i < videos.length; i++) {
      if (!videos[i].paused) {
        videos[i].pause();
        state.pausedVideos.push(videos[i]);
      }
    }
  }

  function unfreeze() {
    if (!state.frozen) return;
    state.frozen = false;

    // 1. Remove freeze CSS
    var freezeStyle = document.getElementById(state.freezeStyleId);
    if (freezeStyle) freezeStyle.remove();

    // 2. Restore original timer functions
    window.setTimeout = _setTimeout;
    window.setInterval = _setInterval;
    window.requestAnimationFrame = _requestAnimationFrame;

    // 3. Replay queued timeouts
    var timeouts = state.queuedTimeouts.splice(0);
    timeouts.forEach(function(entry) {
      _setTimeout(entry.fn, 0);
    });

    // 4. Replay queued rAFs
    var rafs = state.queuedRAFs.splice(0);
    if (rafs.length > 0) {
      _requestAnimationFrame(function(timestamp) {
        rafs.forEach(function(entry) {
          try { entry.fn(timestamp); } catch(e) { /* */ }
        });
      });
    }

    // 5. Restart paused intervals (with fresh intervals)
    state.pausedIntervals.splice(0).forEach(function(entry) {
      _setInterval(entry.fn, entry.interval);
    });

    // 6. Resume WAAPI animations
    state.pausedAnimations.forEach(function(anim) {
      try { anim.play(); } catch(e) { /* */ }
    });
    state.pausedAnimations = [];

    // 7. Resume videos
    state.pausedVideos.forEach(function(video) {
      try { video.play(); } catch(e) { /* */ }
    });
    state.pausedVideos = [];
  }

  function isFrozen() {
    return state.frozen;
  }

  function toggle() {
    if (state.frozen) {
      unfreeze();
    } else {
      freeze();
    }
    return state.frozen;
  }

  function isAgentationElement(el) {
    if (!el || !el.closest) return false;
    return el.closest("[data-agentation-toolbar]") !== null ||
           el.closest("[data-agentation-marker]") !== null ||
           el.classList.contains("ag-popup") ||
           el.closest(".ag-popup") !== null;
  }

  return {
    freeze: freeze,
    unfreeze: unfreeze,
    isFrozen: isFrozen,
    toggle: toggle,
    // Expose originals so other modules can set timers during freeze
    originalSetTimeout: _setTimeout,
    originalSetInterval: _setInterval,
    originalRequestAnimationFrame: _requestAnimationFrame,
    originalClearTimeout: _clearTimeout,
    originalClearInterval: _clearInterval,
    originalCancelAnimationFrame: _cancelAnimationFrame
  };
})();
