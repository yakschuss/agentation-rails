// overlay.js — Hover highlight overlay, selection rectangles, and capture flash.

var AgentationOverlay = (function() {
  var overlay = null;
  var overlayLabel = null;
  var selectionRect = null;
  var currentElement = null;

  function create() {
    if (overlay) return;

    // Hover overlay
    overlay = document.createElement("div");
    overlay.className = "ag-overlay";
    overlay.setAttribute("data-agentation-overlay", "");

    overlayLabel = document.createElement("div");
    overlayLabel.className = "ag-overlay-label";
    overlay.appendChild(overlayLabel);

    document.body.appendChild(overlay);

    // Selection rectangle (for multi-select / area select)
    selectionRect = document.createElement("div");
    selectionRect.className = "ag-selection-rect";
    selectionRect.setAttribute("data-agentation-overlay", "");
    document.body.appendChild(selectionRect);
  }

  function showHoverOverlay(element) {
    if (!overlay) create();
    if (!element || !element.getBoundingClientRect) return;

    currentElement = element;
    var rect = element.getBoundingClientRect();

    overlay.style.top = rect.top + "px";
    overlay.style.left = rect.left + "px";
    overlay.style.width = rect.width + "px";
    overlay.style.height = rect.height + "px";
    overlay.classList.add("ag-visible");

    // Label with element identification
    var identified = AgentationIdentifier.identifyElement(element);
    overlayLabel.textContent = identified.name;
  }

  function hideHoverOverlay() {
    if (overlay) {
      overlay.classList.remove("ag-visible");
    }
    currentElement = null;
  }

  function showSelectionRect(x1, y1, x2, y2) {
    if (!selectionRect) create();

    var left = Math.min(x1, x2);
    var top = Math.min(y1, y2);
    var width = Math.abs(x2 - x1);
    var height = Math.abs(y2 - y1);

    selectionRect.style.left = left + "px";
    selectionRect.style.top = top + "px";
    selectionRect.style.width = width + "px";
    selectionRect.style.height = height + "px";
    selectionRect.classList.add("ag-visible");
  }

  function hideSelectionRect() {
    if (selectionRect) {
      selectionRect.classList.remove("ag-visible");
    }
  }

  function flashElement(element) {
    if (!element || !element.getBoundingClientRect) return;
    var rect = element.getBoundingClientRect();

    var flash = document.createElement("div");
    flash.className = "ag-flash";
    flash.style.top = rect.top + "px";
    flash.style.left = rect.left + "px";
    flash.style.width = rect.width + "px";
    flash.style.height = rect.height + "px";
    document.body.appendChild(flash);

    // Remove after animation
    AgentationFreeze.originalSetTimeout(function() {
      if (flash.parentNode) flash.parentNode.removeChild(flash);
    }, 400);
  }

  function getElementsInRect(x1, y1, x2, y2) {
    var left = Math.min(x1, x2);
    var top = Math.min(y1, y2);
    var right = Math.max(x1, x2);
    var bottom = Math.max(y1, y2);

    var allElements = document.querySelectorAll("body *");
    var matched = [];

    for (var i = 0; i < allElements.length; i++) {
      var el = allElements[i];
      // Skip agentation UI elements
      if (el.closest && (el.closest("[data-agentation-toolbar]") || el.closest("[data-agentation-overlay]") || el.closest("[data-agentation-marker]"))) continue;
      // Skip invisible elements
      if (!el.offsetParent && el.tagName !== "BODY" && el.tagName !== "HTML") continue;

      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;

      // Check intersection
      if (r.left < right && r.right > left && r.top < bottom && r.bottom > top) {
        // Prefer leaf-ish elements (not huge containers)
        if (r.width < (right - left) * 2 && r.height < (bottom - top) * 2) {
          matched.push(el);
        }
      }
    }

    return matched;
  }

  function highlightElements(elements) {
    // Create temporary highlight overlays for multi-selected elements
    elements.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      var highlight = document.createElement("div");
      highlight.className = "ag-flash";
      highlight.style.top = rect.top + "px";
      highlight.style.left = rect.left + "px";
      highlight.style.width = rect.width + "px";
      highlight.style.height = rect.height + "px";
      highlight.style.borderColor = "var(--ag-accent)";
      highlight.style.background = "var(--ag-overlay-bg)";
      highlight.setAttribute("data-agentation-highlight", "");
      document.body.appendChild(highlight);
    });

    // Remove after a brief display
    AgentationFreeze.originalSetTimeout(function() {
      var highlights = document.querySelectorAll("[data-agentation-highlight]");
      for (var i = 0; i < highlights.length; i++) {
        if (highlights[i].parentNode) highlights[i].parentNode.removeChild(highlights[i]);
      }
    }, 600);
  }

  function destroy() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    if (selectionRect && selectionRect.parentNode) selectionRect.parentNode.removeChild(selectionRect);
    overlay = null;
    overlayLabel = null;
    selectionRect = null;
    currentElement = null;
  }

  return {
    create: create,
    showHoverOverlay: showHoverOverlay,
    hideHoverOverlay: hideHoverOverlay,
    showSelectionRect: showSelectionRect,
    hideSelectionRect: hideSelectionRect,
    flashElement: flashElement,
    getElementsInRect: getElementsInRect,
    highlightElements: highlightElements,
    destroy: destroy
  };
})();
