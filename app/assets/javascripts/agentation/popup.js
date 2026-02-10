// popup.js — Comment popup that appears after element capture.

var AgentationPopup = (function() {
  var popupEl = null;
  var currentCallback = null;
  var currentData = null;

  function showPopup(options) {
    // options: { x, y, elementName, selectedText, initialComment, initialIntent,
    //            computedStyles, isEdit, onSubmit, onCancel, onDelete }
    hidePopup();

    currentCallback = options.onSubmit;
    currentData = {
      comment: options.initialComment || "",
      intent: options.initialIntent || "change"
    };

    popupEl = document.createElement("div");
    popupEl.className = "ag-popup";
    popupEl.setAttribute("data-agentation-toolbar", "");

    // Header
    var header = document.createElement("div");
    header.className = "ag-popup-header";
    var nameEl = document.createElement("div");
    nameEl.className = "ag-popup-element-name";
    nameEl.textContent = options.elementName || "Element";
    header.appendChild(nameEl);
    popupEl.appendChild(header);

    // Body
    var body = document.createElement("div");
    body.className = "ag-popup-body";

    // Computed styles accordion (for Detailed+ levels)
    if (options.computedStyles && Object.keys(options.computedStyles).length > 0) {
      var accordion = document.createElement("div");
      accordion.className = "ag-accordion";

      var trigger = document.createElement("button");
      trigger.className = "ag-accordion-trigger";
      trigger.innerHTML = "Computed Styles " + chevronSVG();
      trigger.addEventListener("click", function() {
        trigger.classList.toggle("ag-open");
        content.classList.toggle("ag-open");
      });
      accordion.appendChild(trigger);

      var content = document.createElement("div");
      content.className = "ag-accordion-content";
      var stylesText = Object.keys(options.computedStyles).map(function(key) {
        return key.replace(/([A-Z])/g, "-$1").toLowerCase() + ": " + options.computedStyles[key];
      }).join("\n");
      content.textContent = stylesText;
      accordion.appendChild(content);

      body.appendChild(accordion);
    }

    // Selected text quote
    if (options.selectedText) {
      var quote = document.createElement("div");
      quote.className = "ag-quote";
      quote.textContent = '"' + options.selectedText.slice(0, 150) + '"';
      body.appendChild(quote);
    }

    // Textarea
    var textarea = document.createElement("textarea");
    textarea.className = "ag-textarea";
    textarea.placeholder = "What should change?";
    textarea.value = currentData.comment;
    textarea.addEventListener("input", function() {
      currentData.comment = textarea.value;
    });
    textarea.addEventListener("keydown", function(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        submitPopup();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        hidePopup();
        if (options.onCancel) options.onCancel();
      }
    });
    body.appendChild(textarea);

    // Intent pills
    var intents = document.createElement("div");
    intents.className = "ag-intents";
    var intentOptions = [
      { value: "fix", label: "Fix" },
      { value: "change", label: "Change" },
      { value: "question", label: "?" },
      { value: "approve", label: "OK" }
    ];
    intentOptions.forEach(function(opt) {
      var pill = document.createElement("button");
      pill.className = "ag-intent-pill";
      pill.setAttribute("data-intent", opt.value);
      pill.textContent = opt.label;
      if (currentData.intent === opt.value) pill.classList.add("ag-selected");
      pill.addEventListener("click", function(e) {
        e.preventDefault();
        currentData.intent = opt.value;
        intents.querySelectorAll(".ag-intent-pill").forEach(function(p) {
          p.classList.remove("ag-selected");
        });
        pill.classList.add("ag-selected");
      });
      intents.appendChild(pill);
    });
    body.appendChild(intents);

    popupEl.appendChild(body);

    // Footer
    var footer = document.createElement("div");
    footer.className = "ag-popup-footer";

    if (options.isEdit && options.onDelete) {
      var deleteBtn = document.createElement("button");
      deleteBtn.className = "ag-btn ag-btn-danger";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", function(e) {
        e.preventDefault();
        hidePopup();
        options.onDelete();
      });
      footer.appendChild(deleteBtn);
    }

    var submitBtn = document.createElement("button");
    submitBtn.className = "ag-btn ag-btn-primary";
    submitBtn.textContent = options.isEdit ? "Update" : "Add";
    submitBtn.addEventListener("click", function(e) {
      e.preventDefault();
      submitPopup();
    });
    footer.appendChild(submitBtn);

    popupEl.appendChild(footer);

    // Position popup
    positionPopup(options.x, options.y);

    document.body.appendChild(popupEl);

    // Focus textarea
    AgentationFreeze.originalSetTimeout(function() {
      textarea.focus();
    }, 50);

    // Click outside handler
    AgentationFreeze.originalSetTimeout(function() {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleGlobalKeydown, true);
    }, 100);
  }

  function submitPopup() {
    if (currentCallback) {
      currentCallback({
        comment: currentData.comment,
        intent: currentData.intent
      });
    }
    hidePopup();
  }

  function positionPopup(x, y) {
    if (!popupEl) return;
    var margin = 16;
    var popupWidth = 340;
    var popupHeight = 300; // approximate

    var left = x + 10;
    var top = y + 10;

    // Flip if near right edge
    if (left + popupWidth + margin > window.innerWidth) {
      left = x - popupWidth - 10;
    }
    // Flip if near bottom edge
    if (top + popupHeight + margin > window.innerHeight) {
      top = y - popupHeight - 10;
    }
    // Ensure not offscreen
    left = Math.max(margin, left);
    top = Math.max(margin, top);

    popupEl.style.left = left + "px";
    popupEl.style.top = top + "px";
  }

  function handleOutsideClick(e) {
    if (popupEl && !popupEl.contains(e.target)) {
      shakePopup();
    }
  }

  function handleGlobalKeydown(e) {
    if (e.key === "Escape" && popupEl) {
      e.preventDefault();
      e.stopPropagation();
      hidePopup();
    }
  }

  function hidePopup() {
    document.removeEventListener("mousedown", handleOutsideClick);
    document.removeEventListener("keydown", handleGlobalKeydown, true);
    if (popupEl) {
      popupEl.style.animation = "ag-popup-exit 0.15s ease forwards";
      var el = popupEl;
      AgentationFreeze.originalSetTimeout(function() {
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }, 150);
      popupEl = null;
    }
    currentCallback = null;
    currentData = null;
  }

  function shakePopup() {
    if (!popupEl) return;
    popupEl.style.animation = "ag-shake 0.3s ease";
    AgentationFreeze.originalSetTimeout(function() {
      if (popupEl) popupEl.style.animation = "";
    }, 300);
  }

  function isVisible() {
    return popupEl !== null;
  }

  function destroy() {
    hidePopup();
  }

  function chevronSVG() {
    return '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>';
  }

  return {
    showPopup: showPopup,
    hidePopup: hidePopup,
    shakePopup: shakePopup,
    isVisible: isVisible,
    destroy: destroy
  };
})();
