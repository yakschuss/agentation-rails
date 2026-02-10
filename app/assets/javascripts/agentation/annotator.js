// annotator.js — Selection modes: click, text, multi-select (Shift+drag), area (Alt+drag).

var AgentationAnnotator = (function() {
  var active = false;
  var onCapture = null;
  var detailLevel = "standard";
  var blockInteractions = true;

  // Drag state
  var dragStart = null;
  var isDragging = false;
  var dragMode = null; // "shift" | "alt" | null

  // Text selection bubble
  var textBubble = null;

  function activate(options) {
    if (active) return;
    active = true;
    onCapture = options.onCapture;
    detailLevel = options.detailLevel || "standard";
    blockInteractions = options.blockInteractions !== false;

    document.addEventListener("mousemove", handleMouseMove, true);
    document.addEventListener("mousedown", handleMouseDown, true);
    document.addEventListener("mouseup", handleMouseUp, true);
    document.addEventListener("click", handleClick, true);
    document.addEventListener("selectionchange", handleSelectionChange);

    document.body.classList.add("ag-cursor-crosshair");
    AgentationOverlay.create();
  }

  function deactivate() {
    if (!active) return;
    active = false;

    document.removeEventListener("mousemove", handleMouseMove, true);
    document.removeEventListener("mousedown", handleMouseDown, true);
    document.removeEventListener("mouseup", handleMouseUp, true);
    document.removeEventListener("click", handleClick, true);
    document.removeEventListener("selectionchange", handleSelectionChange);

    document.body.classList.remove("ag-cursor-crosshair");
    AgentationOverlay.hideHoverOverlay();
    AgentationOverlay.hideSelectionRect();
    removeTextBubble();
    dragStart = null;
    isDragging = false;
    dragMode = null;
  }

  function isActive() {
    return active;
  }

  // ==========================================================================
  // Event Handlers
  // ==========================================================================

  function handleMouseMove(e) {
    if (!active) return;
    if (isAgentationUI(e.target)) return;

    if (isDragging && dragStart) {
      // Draw selection rectangle
      AgentationOverlay.showSelectionRect(dragStart.x, dragStart.y, e.clientX, e.clientY);
      AgentationOverlay.hideHoverOverlay();
      return;
    }

    // Hover overlay
    var element = getTargetElement(e);
    if (element) {
      AgentationOverlay.showHoverOverlay(element);
    } else {
      AgentationOverlay.hideHoverOverlay();
    }
  }

  function handleMouseDown(e) {
    if (!active) return;
    if (isAgentationUI(e.target)) return;

    dragStart = { x: e.clientX, y: e.clientY };
    isDragging = false;
    dragMode = null;

    if (e.shiftKey) {
      dragMode = "shift"; // multi-select
      e.preventDefault();
    } else if (e.altKey) {
      dragMode = "alt"; // area select
      e.preventDefault();
    }
  }

  function handleMouseUp(e) {
    if (!active) return;
    if (!dragStart) return;

    var dx = e.clientX - dragStart.x;
    var dy = e.clientY - dragStart.y;
    var distance = Math.sqrt(dx * dx + dy * dy);

    AgentationOverlay.hideSelectionRect();

    if (distance > 5 && dragMode === "shift") {
      // Multi-select mode
      handleMultiSelect(dragStart.x, dragStart.y, e.clientX, e.clientY);
    } else if (distance > 5 && dragMode === "alt") {
      // Area select mode
      handleAreaSelect(dragStart.x, dragStart.y, e.clientX, e.clientY);
    }
    // Click mode is handled in handleClick

    dragStart = null;
    isDragging = false;
    dragMode = null;
  }

  function handleClick(e) {
    if (!active) return;
    if (isAgentationUI(e.target)) return;

    // Block the click from reaching the host app
    if (blockInteractions) {
      e.preventDefault();
      e.stopPropagation();
    }

    // If popup is visible, don't capture
    if (AgentationPopup.isVisible()) return;

    // Check for text selection (handled separately)
    var selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) return;

    // Only treat as click if the mouse didn't move much (not a drag)
    if (dragStart) {
      var dx = e.clientX - dragStart.x;
      var dy = e.clientY - dragStart.y;
      if (Math.sqrt(dx * dx + dy * dy) > 5) return;
    }

    var element = getTargetElement(e);
    if (!element) return;

    // Capture element data
    var data = AgentationIdentifier.captureElement(element, detailLevel);
    data.x = e.clientX + window.scrollX;
    data.y = e.clientY + window.scrollY;
    data.isFixed = isFixedPosition(element);
    if (data.isFixed) {
      data.x = e.clientX;
      data.y = e.clientY;
    }

    // Flash overlay
    AgentationOverlay.flashElement(element);
    AgentationOverlay.hideHoverOverlay();

    // Trigger capture callback
    if (onCapture) {
      onCapture({
        type: "click",
        data: data,
        clickX: e.clientX,
        clickY: e.clientY,
        element: element
      });
    }
  }

  function handleSelectionChange() {
    if (!active) return;
    removeTextBubble();

    var selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

    var selectedText = selection.toString().trim();
    if (selectedText.length === 0) return;

    // Get the range and position the bubble
    var range = selection.getRangeAt(0);
    var rect = range.getBoundingClientRect();

    textBubble = document.createElement("div");
    textBubble.className = "ag-text-bubble";
    textBubble.setAttribute("data-agentation-toolbar", "");
    textBubble.textContent = "Annotate";
    textBubble.style.left = (rect.left + rect.width / 2 - 35) + "px";
    textBubble.style.top = (rect.top - 30) + "px";

    textBubble.addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation();

      var container = range.commonAncestorContainer;
      if (container.nodeType === 3) container = container.parentElement;

      var data = AgentationIdentifier.captureElement(container, detailLevel);
      data.selectedText = selectedText;
      data.x = rect.left + window.scrollX;
      data.y = rect.top + window.scrollY;
      data.isFixed = false;

      removeTextBubble();
      selection.removeAllRanges();

      if (onCapture) {
        onCapture({
          type: "text",
          data: data,
          clickX: rect.left + rect.width / 2,
          clickY: rect.top,
          element: container
        });
      }
    });

    document.body.appendChild(textBubble);
  }

  // ==========================================================================
  // Multi-Select
  // ==========================================================================

  function handleMultiSelect(x1, y1, x2, y2) {
    var elements = AgentationOverlay.getElementsInRect(x1, y1, x2, y2);
    if (elements.length === 0) return;

    // Highlight selected elements
    AgentationOverlay.highlightElements(elements);

    // Capture data for all elements
    var multiData = elements.map(function(el) {
      return AgentationIdentifier.captureElement(el, detailLevel);
    });

    var centerX = (x1 + x2) / 2;
    var centerY = (y1 + y2) / 2;

    var data = {
      elementName: multiData.length + " elements selected",
      isMultiSelect: true,
      multiSelectElements: multiData.map(function(d) { return { name: d.elementName, selector: d.selector }; }),
      x: centerX + window.scrollX,
      y: centerY + window.scrollY,
      isFixed: false,
      selector: "",
      path: "",
      boundingBox: {
        x1: Math.min(x1, x2),
        y1: Math.min(y1, y2),
        x2: Math.max(x1, x2),
        y2: Math.max(y1, y2)
      }
    };

    if (onCapture) {
      onCapture({
        type: "multi-select",
        data: data,
        clickX: centerX,
        clickY: centerY,
        elements: elements
      });
    }
  }

  // ==========================================================================
  // Area Select
  // ==========================================================================

  function handleAreaSelect(x1, y1, x2, y2) {
    var elements = AgentationOverlay.getElementsInRect(x1, y1, x2, y2);
    var centerX = (x1 + x2) / 2;
    var centerY = (y1 + y2) / 2;

    var data = {
      elementName: "Area selection" + (elements.length > 0 ? " (" + elements.length + " elements)" : ""),
      isAreaSelect: true,
      x: centerX + window.scrollX,
      y: centerY + window.scrollY,
      isFixed: false,
      selector: "",
      path: "",
      boundingBox: {
        x1: Math.min(x1, x2),
        y1: Math.min(y1, y2),
        x2: Math.max(x1, x2),
        y2: Math.max(y1, y2)
      }
    };

    if (elements.length > 0) {
      data.multiSelectElements = elements.slice(0, 10).map(function(el) {
        var identified = AgentationIdentifier.identifyElement(el);
        return { name: identified.name, selector: AgentationIdentifier.generateSelector(el) };
      });
    }

    if (onCapture) {
      onCapture({
        type: "area",
        data: data,
        clickX: centerX,
        clickY: centerY,
        elements: elements
      });
    }
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  function getTargetElement(e) {
    var target = e.target;
    // Walk up from tiny elements (SVGs, spans) to find a meaningful target
    while (target && target !== document.body) {
      if (isAgentationUI(target)) return null;
      // If the element is very small and has a parent, prefer the parent
      var rect = target.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) {
        target = target.parentElement;
        continue;
      }
      return target;
    }
    return null;
  }

  function isAgentationUI(el) {
    if (!el || !el.closest) return false;
    return el.closest("[data-agentation-toolbar]") !== null ||
           el.closest("[data-agentation-overlay]") !== null ||
           el.closest("[data-agentation-marker]") !== null ||
           el.classList.contains("ag-text-bubble") ||
           el.closest(".ag-text-bubble") !== null;
  }

  function isFixedPosition(element) {
    var current = element;
    while (current && current !== document.body) {
      var position = window.getComputedStyle(current).position;
      if (position === "fixed" || position === "sticky") return true;
      current = current.parentElement;
    }
    return false;
  }

  function removeTextBubble() {
    if (textBubble && textBubble.parentNode) {
      textBubble.parentNode.removeChild(textBubble);
    }
    textBubble = null;
  }

  function updateSettings(options) {
    if (options.detailLevel) detailLevel = options.detailLevel;
    if (options.blockInteractions !== undefined) blockInteractions = options.blockInteractions;
  }

  return {
    activate: activate,
    deactivate: deactivate,
    isActive: isActive,
    updateSettings: updateSettings
  };
})();
