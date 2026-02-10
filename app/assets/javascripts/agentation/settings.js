// settings.js — Settings panel UI.

var AgentationSettings = (function() {
  var settingsEl = null;
  var currentSettings = null;
  var onChange = null;

  var COLORS = [
    { name: "Purple", value: "#8b5cf6" },
    { name: "Blue",   value: "#3c82f7" },
    { name: "Cyan",   value: "#06b6d4" },
    { name: "Green",  value: "#22c55e" },
    { name: "Yellow", value: "#eab308" },
    { name: "Orange", value: "#f97316" }
  ];

  var DETAIL_LEVELS = [
    { value: "compact",  label: "Compact" },
    { value: "standard", label: "Standard" },
    { value: "detailed", label: "Detailed" },
    { value: "forensic", label: "Forensic" }
  ];

  function create(options) {
    onChange = options.onChange;
    currentSettings = options.settings || AgentationStorage.loadSettings();

    settingsEl = document.createElement("div");
    settingsEl.className = "ag-settings";
    settingsEl.setAttribute("data-agentation-toolbar", "");

    // Header
    var header = document.createElement("div");
    header.className = "ag-settings-header";
    header.innerHTML = "<span>Settings</span>";
    var closeBtn = document.createElement("button");
    closeBtn.className = "ag-icon-btn";
    closeBtn.innerHTML = svgIcon("x");
    closeBtn.addEventListener("click", function(e) {
      e.preventDefault();
      hide();
    });
    header.appendChild(closeBtn);
    settingsEl.appendChild(header);

    // Body
    var body = document.createElement("div");
    body.className = "ag-settings-body";

    // Detail level
    body.appendChild(createRadioGroup("Output Detail", DETAIL_LEVELS, currentSettings.detailLevel, function(val) {
      currentSettings.detailLevel = val;
      emitChange();
    }));

    // Color
    body.appendChild(createColorGroup("Annotation Color", COLORS, currentSettings.color, function(val) {
      currentSettings.color = val;
      emitChange();
    }));

    // Auto-clear after copy
    body.appendChild(createToggle("Auto-clear after copy", currentSettings.autoClearAfterCopy, function(val) {
      currentSettings.autoClearAfterCopy = val;
      emitChange();
    }));

    // Marker click behavior
    body.appendChild(createRadioGroup("Marker Click", [
      { value: "edit", label: "Edit" },
      { value: "delete", label: "Delete" }
    ], currentSettings.markerClickBehavior, function(val) {
      currentSettings.markerClickBehavior = val;
      emitChange();
    }));

    // Block interactions
    body.appendChild(createToggle("Block page interactions", currentSettings.blockInteractions, function(val) {
      currentSettings.blockInteractions = val;
      emitChange();
    }));

    settingsEl.appendChild(body);
    return settingsEl;
  }

  function show() {
    if (settingsEl) settingsEl.classList.add("ag-visible");
  }

  function hide() {
    if (settingsEl) settingsEl.classList.remove("ag-visible");
  }

  function isVisible() {
    return settingsEl && settingsEl.classList.contains("ag-visible");
  }

  function getSettings() {
    return currentSettings;
  }

  function emitChange() {
    AgentationStorage.saveSettings(currentSettings);
    if (onChange) onChange(currentSettings);
  }

  function destroy() {
    if (settingsEl && settingsEl.parentNode) settingsEl.parentNode.removeChild(settingsEl);
    settingsEl = null;
    onChange = null;
  }

  // ==========================================================================
  // UI Builders
  // ==========================================================================

  function createRadioGroup(label, options, selected, onSelect) {
    var group = document.createElement("div");
    group.className = "ag-setting-group";

    var labelEl = document.createElement("label");
    labelEl.className = "ag-setting-label";
    labelEl.textContent = label;
    group.appendChild(labelEl);

    var radios = document.createElement("div");
    radios.className = "ag-radios";

    options.forEach(function(opt) {
      var radio = document.createElement("button");
      radio.className = "ag-radio";
      if (opt.value === selected) radio.classList.add("ag-selected");
      radio.textContent = opt.label;
      radio.addEventListener("click", function(e) {
        e.preventDefault();
        radios.querySelectorAll(".ag-radio").forEach(function(r) { r.classList.remove("ag-selected"); });
        radio.classList.add("ag-selected");
        onSelect(opt.value);
      });
      radios.appendChild(radio);
    });

    group.appendChild(radios);
    return group;
  }

  function createColorGroup(label, colors, selected, onSelect) {
    var group = document.createElement("div");
    group.className = "ag-setting-group";

    var labelEl = document.createElement("label");
    labelEl.className = "ag-setting-label";
    labelEl.textContent = label;
    group.appendChild(labelEl);

    var container = document.createElement("div");
    container.className = "ag-colors";

    colors.forEach(function(color) {
      var pill = document.createElement("button");
      pill.className = "ag-color-pill";
      pill.style.background = color.value;
      pill.title = color.name;
      if (color.value === selected) pill.classList.add("ag-selected");
      pill.addEventListener("click", function(e) {
        e.preventDefault();
        container.querySelectorAll(".ag-color-pill").forEach(function(p) { p.classList.remove("ag-selected"); });
        pill.classList.add("ag-selected");
        onSelect(color.value);
      });
      container.appendChild(pill);
    });

    group.appendChild(container);
    return group;
  }

  function createToggle(label, initialValue, onToggle) {
    var group = document.createElement("div");
    group.className = "ag-setting-group";

    var toggle = document.createElement("div");
    toggle.className = "ag-toggle" + (initialValue ? " ag-on" : "");
    toggle.addEventListener("click", function(e) {
      e.preventDefault();
      var isOn = toggle.classList.toggle("ag-on");
      onToggle(isOn);
    });

    var labelEl = document.createElement("span");
    labelEl.className = "ag-toggle-label";
    labelEl.textContent = label;
    toggle.appendChild(labelEl);

    var track = document.createElement("div");
    track.className = "ag-toggle-track";
    var thumb = document.createElement("div");
    thumb.className = "ag-toggle-thumb";
    track.appendChild(thumb);
    toggle.appendChild(track);

    group.appendChild(toggle);
    return group;
  }

  function svgIcon(name) {
    if (name === "x") {
      return '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
    }
    return "";
  }

  return {
    create: create,
    show: show,
    hide: hide,
    isVisible: isVisible,
    getSettings: getSettings,
    destroy: destroy
  };
})();
