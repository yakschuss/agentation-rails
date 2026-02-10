// toolbar.js — Main toolbar UI and controller. Orchestrates all modules.

var AgentationToolbar = (function() {
  var toolbarEl = null;
  var toggleBtn = null;
  var badge = null;
  var panel = null;
  var panelBody = null;
  var settingsPanel = null;
  var isActive = false;
  var annotations = [];
  var currentIndex = -1;
  var theme = "light";
  var settings = {};

  function init(config) {
    config = config || {};

    // Load persisted state
    settings = AgentationStorage.loadSettings();
    theme = AgentationStorage.loadTheme();
    annotations = AgentationStorage.loadAnnotations();

    // Apply config overrides
    if (config.defaultDetail && !localStorage.getItem("agentation:__settings__")) {
      settings.detailLevel = config.defaultDetail;
    }
    if (config.color && !localStorage.getItem("agentation:__settings__")) {
      settings.color = config.color;
    }

    // Inject styles
    AgentationStyles.injectStyles();
    AgentationStyles.updateAccentColor(settings.color);

    // Apply theme
    document.documentElement.setAttribute("data-agentation-theme", theme);

    // Build toolbar
    buildToolbar();

    // Set up marker click handler
    AgentationMarkers.setOnMarkerClick(function(annotationId) {
      if (settings.markerClickBehavior === "delete") {
        deleteAnnotation(annotationId);
      } else {
        editAnnotation(annotationId);
      }
    });

    // Render initial markers
    if (annotations.length > 0) {
      AgentationMarkers.updateMarkers(annotations, settings.color);
      updateBadge();
    }
  }

  // ==========================================================================
  // Build UI
  // ==========================================================================

  function buildToolbar() {
    toolbarEl = document.createElement("div");
    toolbarEl.setAttribute("data-agentation-toolbar", "");

    // Toggle button
    toggleBtn = document.createElement("button");
    toggleBtn.className = "ag-toggle-btn";
    toggleBtn.innerHTML = svgIcon("search");
    toggleBtn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggle();
    });

    // Badge
    badge = document.createElement("div");
    badge.className = "ag-badge";
    badge.style.display = "none";
    toggleBtn.appendChild(badge);

    toolbarEl.appendChild(toggleBtn);

    // Panel
    panel = document.createElement("div");
    panel.className = "ag-panel";

    // Panel header
    var header = document.createElement("div");
    header.className = "ag-panel-header";

    var title = document.createElement("span");
    title.className = "ag-panel-header-title";
    title.textContent = "Agentation";
    header.appendChild(title);

    var actions = document.createElement("div");
    actions.className = "ag-panel-actions";

    // Freeze button
    var freezeBtn = createIconButton("pause", "Freeze animations", function() {
      var frozen = AgentationFreeze.toggle();
      freezeBtn.classList.toggle("ag-active", frozen);
    });
    actions.appendChild(freezeBtn);

    // Markers toggle
    var markersBtn = createIconButton("markers", "Toggle markers", function() {
      settings.showMarkers = !settings.showMarkers;
      markersBtn.classList.toggle("ag-active", settings.showMarkers);
      AgentationMarkers.setMarkersVisible(settings.showMarkers);
    });
    markersBtn.classList.add("ag-active");
    actions.appendChild(markersBtn);

    // Theme toggle
    var themeBtn = createIconButton("theme", "Toggle theme", function() {
      theme = theme === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-agentation-theme", theme);
      AgentationStorage.saveTheme(theme);
    });
    actions.appendChild(themeBtn);

    // Settings button
    var settingsBtn = createIconButton("settings", "Settings", function() {
      if (AgentationSettings.isVisible()) {
        AgentationSettings.hide();
      } else {
        AgentationSettings.show();
      }
    });
    actions.appendChild(settingsBtn);

    header.appendChild(actions);
    panel.appendChild(header);

    // Panel body
    panelBody = document.createElement("div");
    panelBody.className = "ag-panel-body";
    panel.appendChild(panelBody);

    // Panel footer
    var footer = document.createElement("div");
    footer.className = "ag-panel-footer";

    var copyBtn = document.createElement("button");
    copyBtn.className = "ag-btn ag-btn-primary";
    copyBtn.textContent = "Copy";
    copyBtn.addEventListener("click", function(e) {
      e.preventDefault();
      handleCopy();
    });
    footer.appendChild(copyBtn);

    var clearBtn = document.createElement("button");
    clearBtn.className = "ag-btn ag-btn-danger";
    clearBtn.textContent = "Clear";
    clearBtn.addEventListener("click", function(e) {
      e.preventDefault();
      handleClear();
    });
    footer.appendChild(clearBtn);

    panel.appendChild(footer);
    toolbarEl.appendChild(panel);

    // Settings panel
    settingsPanel = AgentationSettings.create({
      settings: settings,
      onChange: function(newSettings) {
        settings = newSettings;
        AgentationStyles.updateAccentColor(settings.color);
        AgentationMarkers.updateMarkers(annotations, settings.color);
        AgentationAnnotator.updateSettings({
          detailLevel: settings.detailLevel,
          blockInteractions: settings.blockInteractions
        });
      }
    });
    toolbarEl.appendChild(settingsPanel);

    document.body.appendChild(toolbarEl);
    renderPanelBody();
  }

  // ==========================================================================
  // Toggle Active State
  // ==========================================================================

  function toggle() {
    isActive = !isActive;
    toggleBtn.classList.toggle("ag-active", isActive);

    if (isActive) {
      panel.classList.add("ag-visible");
      AgentationAnnotator.activate({
        onCapture: handleCapture,
        detailLevel: settings.detailLevel,
        blockInteractions: settings.blockInteractions
      });
    } else {
      panel.classList.remove("ag-visible");
      AgentationSettings.hide();
      AgentationAnnotator.deactivate();
      // Unfreeze if active
      if (AgentationFreeze.isFrozen()) {
        AgentationFreeze.unfreeze();
      }
    }
  }

  // ==========================================================================
  // Annotation Management
  // ==========================================================================

  function handleCapture(captureEvent) {
    var data = captureEvent.data;

    // Show popup for comment
    AgentationPopup.showPopup({
      x: captureEvent.clickX,
      y: captureEvent.clickY,
      elementName: data.elementName,
      selectedText: data.selectedText,
      computedStyles: data.computedStyles,
      onSubmit: function(result) {
        addAnnotation(Object.assign({}, data, {
          id: generateId(),
          comment: result.comment,
          intent: result.intent,
          timestamp: Date.now()
        }));
      },
      onCancel: function() {
        // Nothing to do
      }
    });
  }

  function addAnnotation(annotation) {
    annotations.push(annotation);
    currentIndex = annotations.length - 1;
    save();
    AgentationMarkers.updateMarkers(annotations, settings.color);
    updateBadge();
    renderPanelBody();
  }

  function editAnnotation(annotationId) {
    var index = annotations.findIndex(function(a) { return a.id === annotationId; });
    if (index === -1) return;

    var annotation = annotations[index];
    currentIndex = index;

    AgentationPopup.showPopup({
      x: annotation.isFixed ? annotation.x : annotation.x - window.scrollX,
      y: annotation.isFixed ? annotation.y : annotation.y - window.scrollY,
      elementName: annotation.elementName,
      selectedText: annotation.selectedText,
      computedStyles: annotation.computedStyles,
      initialComment: annotation.comment,
      initialIntent: annotation.intent,
      isEdit: true,
      onSubmit: function(result) {
        annotations[index].comment = result.comment;
        annotations[index].intent = result.intent;
        save();
        renderPanelBody();
      },
      onDelete: function() {
        deleteAnnotation(annotationId);
      },
      onCancel: function() {}
    });
  }

  function deleteAnnotation(annotationId) {
    annotations = annotations.filter(function(a) { return a.id !== annotationId; });
    if (currentIndex >= annotations.length) currentIndex = annotations.length - 1;
    save();
    AgentationMarkers.updateMarkers(annotations, settings.color);
    updateBadge();
    renderPanelBody();
  }

  function save() {
    AgentationStorage.saveAnnotations(null, annotations);
  }

  // ==========================================================================
  // Copy & Clear
  // ==========================================================================

  function handleCopy() {
    var markdown = AgentationOutput.generateOutput(annotations, settings.detailLevel);
    if (!markdown) return;

    copyToClipboard(markdown);
    showCopyFeedback();

    if (settings.autoClearAfterCopy) {
      handleClear();
    }
  }

  function handleClear() {
    annotations = [];
    currentIndex = -1;
    save();
    AgentationMarkers.clearMarkers();
    updateBadge();
    renderPanelBody();
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function() {
        fallbackCopy(text);
      });
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }

  function showCopyFeedback() {
    var feedback = document.createElement("div");
    feedback.className = "ag-copy-feedback";
    feedback.textContent = "Copied to clipboard!";
    document.body.appendChild(feedback);
    AgentationFreeze.originalSetTimeout(function() {
      if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
    }, 1500);
  }

  // ==========================================================================
  // Panel Body Rendering
  // ==========================================================================

  function renderPanelBody() {
    if (!panelBody) return;
    panelBody.innerHTML = "";

    if (annotations.length === 0) {
      var empty = document.createElement("div");
      empty.className = "ag-empty";
      empty.innerHTML = '<div class="ag-empty-icon">+</div>Click elements to annotate them';
      panelBody.appendChild(empty);
      return;
    }

    // Navigation
    if (annotations.length > 1) {
      var nav = document.createElement("div");
      nav.className = "ag-nav";

      var label = document.createElement("span");
      label.className = "ag-nav-label";
      label.textContent = (currentIndex + 1) + " of " + annotations.length;
      nav.appendChild(label);

      var buttons = document.createElement("div");
      buttons.className = "ag-nav-buttons";

      var prevBtn = document.createElement("button");
      prevBtn.className = "ag-icon-btn";
      prevBtn.innerHTML = svgIcon("chevron-left");
      prevBtn.addEventListener("click", function(e) {
        e.preventDefault();
        navigateAnnotations(-1);
      });
      buttons.appendChild(prevBtn);

      var nextBtn = document.createElement("button");
      nextBtn.className = "ag-icon-btn";
      nextBtn.innerHTML = svgIcon("chevron-right");
      nextBtn.addEventListener("click", function(e) {
        e.preventDefault();
        navigateAnnotations(1);
      });
      buttons.appendChild(nextBtn);

      nav.appendChild(buttons);
      panelBody.appendChild(nav);
    }

    // Current annotation preview
    if (currentIndex >= 0 && currentIndex < annotations.length) {
      var annotation = annotations[currentIndex];
      var preview = document.createElement("div");
      preview.className = "ag-annotation-preview";

      var name = document.createElement("div");
      name.className = "ag-annotation-name";
      if (annotation.intent) {
        var intentBadge = document.createElement("span");
        intentBadge.className = "ag-annotation-intent ag-intent-" + annotation.intent;
        intentBadge.textContent = annotation.intent;
        name.appendChild(intentBadge);
      }
      name.appendChild(document.createTextNode(annotation.elementName || "Element"));
      preview.appendChild(name);

      if (annotation.comment) {
        var comment = document.createElement("div");
        comment.className = "ag-annotation-comment";
        comment.textContent = annotation.comment;
        preview.appendChild(comment);
      }

      preview.style.cursor = "pointer";
      preview.addEventListener("click", function() {
        editAnnotation(annotation.id);
      });

      panelBody.appendChild(preview);
    }
  }

  function navigateAnnotations(direction) {
    if (annotations.length === 0) return;
    currentIndex = (currentIndex + direction + annotations.length) % annotations.length;
    renderPanelBody();
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  function updateBadge() {
    if (!badge) return;
    if (annotations.length > 0) {
      badge.textContent = String(annotations.length);
      badge.style.display = "";
    } else {
      badge.style.display = "none";
    }
  }

  function generateId() {
    return "ag_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function createIconButton(icon, title, onClick) {
    var btn = document.createElement("button");
    btn.className = "ag-icon-btn";
    btn.title = title;
    btn.innerHTML = svgIcon(icon);
    btn.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  function svgIcon(name) {
    var icons = {
      search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>',
      pause: '<svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>',
      markers: '<svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="3"></circle><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"></path></svg>',
      theme: '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
      settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
      "chevron-left": '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>',
      "chevron-right": '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>',
      x: '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>'
    };
    return icons[name] || "";
  }

  function destroy() {
    if (isActive) {
      AgentationAnnotator.deactivate();
      if (AgentationFreeze.isFrozen()) AgentationFreeze.unfreeze();
    }
    AgentationMarkers.destroy();
    AgentationOverlay.destroy();
    AgentationPopup.destroy();
    AgentationSettings.destroy();
    if (toolbarEl && toolbarEl.parentNode) toolbarEl.parentNode.removeChild(toolbarEl);
    toolbarEl = null;
  }

  return {
    init: init,
    destroy: destroy
  };
})();
