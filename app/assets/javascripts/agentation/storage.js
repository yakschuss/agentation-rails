// storage.js — localStorage persistence for annotations, settings, and theme.

var AgentationStorage = (function() {
  var PREFIX = "agentation:";
  var SETTINGS_KEY = PREFIX + "__settings__";
  var THEME_KEY = PREFIX + "__theme__";
  var RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  function isAvailable() {
    try {
      var key = "__ag_test__";
      localStorage.setItem(key, "1");
      localStorage.removeItem(key);
      return true;
    } catch(e) {
      return false;
    }
  }

  // ==========================================================================
  // Annotations
  // ==========================================================================

  function annotationKey(pathname) {
    return PREFIX + (pathname || window.location.pathname);
  }

  function loadAnnotations(pathname) {
    if (!isAvailable()) return [];
    try {
      var raw = localStorage.getItem(annotationKey(pathname));
      if (!raw) return [];
      var data = JSON.parse(raw);
      if (!data || !data.annotations) return [];
      // Check TTL
      if (data.savedAt && (Date.now() - data.savedAt > RETENTION_MS)) {
        localStorage.removeItem(annotationKey(pathname));
        return [];
      }
      return data.annotations;
    } catch(e) {
      return [];
    }
  }

  function saveAnnotations(pathname, annotations) {
    if (!isAvailable()) return;
    var key = annotationKey(pathname);
    if (!annotations || annotations.length === 0) {
      localStorage.removeItem(key);
      return;
    }
    try {
      localStorage.setItem(key, JSON.stringify({
        annotations: annotations,
        savedAt: Date.now()
      }));
    } catch(e) {
      // localStorage full — silently fail
    }
  }

  function clearAnnotations(pathname) {
    if (!isAvailable()) return;
    localStorage.removeItem(annotationKey(pathname));
  }

  function loadAllAnnotations() {
    if (!isAvailable()) return {};
    var result = {};
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(PREFIX) === 0 && key !== SETTINGS_KEY && key !== THEME_KEY) {
        var pathname = key.slice(PREFIX.length);
        if (pathname.indexOf("__") !== 0) {
          var annotations = loadAnnotations(pathname);
          if (annotations.length > 0) {
            result[pathname] = annotations;
          }
        }
      }
    }
    return result;
  }

  // ==========================================================================
  // Settings
  // ==========================================================================

  var DEFAULT_SETTINGS = {
    detailLevel: "standard",
    color: "#3c82f7",
    autoClearAfterCopy: false,
    markerClickBehavior: "edit",
    blockInteractions: true,
    showMarkers: true
  };

  function loadSettings() {
    if (!isAvailable()) return Object.assign({}, DEFAULT_SETTINGS);
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return Object.assign({}, DEFAULT_SETTINGS);
      var saved = JSON.parse(raw);
      return Object.assign({}, DEFAULT_SETTINGS, saved);
    } catch(e) {
      return Object.assign({}, DEFAULT_SETTINGS);
    }
  }

  function saveSettings(settings) {
    if (!isAvailable()) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch(e) { /* full */ }
  }

  // ==========================================================================
  // Theme
  // ==========================================================================

  function loadTheme() {
    if (!isAvailable()) return "light";
    return localStorage.getItem(THEME_KEY) || "light";
  }

  function saveTheme(theme) {
    if (!isAvailable()) return;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch(e) { /* full */ }
  }

  // ==========================================================================
  // Cleanup (remove expired entries)
  // ==========================================================================

  function cleanup() {
    if (!isAvailable()) return;
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf(PREFIX) === 0 && key !== SETTINGS_KEY && key !== THEME_KEY) {
        try {
          var raw = localStorage.getItem(key);
          if (raw) {
            var data = JSON.parse(raw);
            if (data.savedAt && (Date.now() - data.savedAt > RETENTION_MS)) {
              keysToRemove.push(key);
            }
          }
        } catch(e) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(function(k) { localStorage.removeItem(k); });
  }

  // Run cleanup on load
  cleanup();

  return {
    loadAnnotations: loadAnnotations,
    saveAnnotations: saveAnnotations,
    clearAnnotations: clearAnnotations,
    loadAllAnnotations: loadAllAnnotations,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    loadTheme: loadTheme,
    saveTheme: saveTheme,
    cleanup: cleanup,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS
  };
})();
