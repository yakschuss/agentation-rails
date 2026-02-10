// identifier.js — Element identification with Rails context detection.
// Ported from agentation's element-identification.ts + Rails-specific additions.

var AgentationIdentifier = (function() {

  // ==========================================================================
  // Shadow DOM Helpers
  // ==========================================================================

  function getParentElement(element) {
    if (element.parentElement) return element.parentElement;
    var root = element.getRootNode();
    if (root instanceof ShadowRoot) return root.host;
    return null;
  }

  function closestCrossingShadow(element, selector) {
    var current = element;
    while (current) {
      try { if (current.matches && current.matches(selector)) return current; } catch(e) { /* invalid selector */ }
      current = getParentElement(current);
    }
    return null;
  }

  // ==========================================================================
  // Element Path
  // ==========================================================================

  function getElementPath(target, maxDepth) {
    maxDepth = maxDepth || 4;
    var parts = [];
    var current = target;
    var depth = 0;

    while (current && depth < maxDepth) {
      var tag = current.tagName.toLowerCase();
      if (tag === "html" || tag === "body") break;

      var identifier = tag;
      if (current.id) {
        identifier = "#" + current.id;
      } else if (current.className && typeof current.className === "string") {
        var meaningfulClass = current.className
          .split(/\s+/)
          .find(function(c) { return c.length > 2 && !c.match(/^[a-z]{1,2}$/) && !c.match(/[A-Z0-9]{5,}/); });
        if (meaningfulClass) {
          identifier = "." + meaningfulClass.split("_")[0];
        }
      }

      var nextParent = getParentElement(current);
      if (!current.parentElement && nextParent) {
        identifier = "\u27E8shadow\u27E9 " + identifier;
      }

      parts.unshift(identifier);
      current = nextParent;
      depth++;
    }

    return parts.join(" > ");
  }

  // ==========================================================================
  // Element Identification
  // ==========================================================================

  function identifyElement(target) {
    var path = getElementPath(target);

    if (target.dataset && target.dataset.element) {
      return { name: target.dataset.element, path: path };
    }

    var tag = target.tagName.toLowerCase();

    // SVG elements
    if (["path", "circle", "rect", "line", "g"].indexOf(tag) !== -1) {
      var svg = closestCrossingShadow(target, "svg");
      if (svg) {
        var parent = getParentElement(svg);
        if (parent && parent.tagName) {
          var parentName = identifyElement(parent).name;
          return { name: "graphic in " + parentName, path: path };
        }
      }
      return { name: "graphic element", path: path };
    }
    if (tag === "svg") {
      var svgParent = getParentElement(target);
      if (svgParent && svgParent.tagName && svgParent.tagName.toLowerCase() === "button") {
        var btnText = (svgParent.textContent || "").trim();
        return { name: btnText ? 'icon in "' + btnText + '" button' : "button icon", path: path };
      }
      return { name: "icon", path: path };
    }

    // Interactive elements
    if (tag === "button") {
      var text = (target.textContent || "").trim();
      var ariaLabel = target.getAttribute("aria-label");
      if (ariaLabel) return { name: "button [" + ariaLabel + "]", path: path };
      return { name: text ? 'button "' + text.slice(0, 25) + '"' : "button", path: path };
    }
    if (tag === "a") {
      var aText = (target.textContent || "").trim();
      var href = target.getAttribute("href");
      if (aText) return { name: 'link "' + aText.slice(0, 25) + '"', path: path };
      if (href) return { name: "link to " + href.slice(0, 30), path: path };
      return { name: "link", path: path };
    }
    if (tag === "input") {
      var type = target.getAttribute("type") || "text";
      var placeholder = target.getAttribute("placeholder");
      var name = target.getAttribute("name");
      if (placeholder) return { name: 'input "' + placeholder + '"', path: path };
      if (name) return { name: "input [" + name + "]", path: path };
      return { name: type + " input", path: path };
    }
    if (tag === "select") {
      var selectName = target.getAttribute("name");
      return { name: selectName ? "select [" + selectName + "]" : "select", path: path };
    }
    if (tag === "textarea") {
      var taPlaceholder = target.getAttribute("placeholder");
      var taName = target.getAttribute("name");
      if (taPlaceholder) return { name: 'textarea "' + taPlaceholder + '"', path: path };
      if (taName) return { name: "textarea [" + taName + "]", path: path };
      return { name: "textarea", path: path };
    }

    // Headings
    if (["h1", "h2", "h3", "h4", "h5", "h6"].indexOf(tag) !== -1) {
      var hText = (target.textContent || "").trim();
      return { name: hText ? tag + ' "' + hText.slice(0, 35) + '"' : tag, path: path };
    }

    // Text elements
    if (tag === "p") {
      var pText = (target.textContent || "").trim();
      if (pText) return { name: 'paragraph: "' + pText.slice(0, 40) + (pText.length > 40 ? "..." : "") + '"', path: path };
      return { name: "paragraph", path: path };
    }
    if (tag === "span" || tag === "label") {
      var sText = (target.textContent || "").trim();
      if (sText && sText.length < 40) return { name: '"' + sText + '"', path: path };
      return { name: tag, path: path };
    }
    if (tag === "li") {
      var liText = (target.textContent || "").trim();
      if (liText && liText.length < 40) return { name: 'list item: "' + liText.slice(0, 35) + '"', path: path };
      return { name: "list item", path: path };
    }
    if (tag === "blockquote") return { name: "blockquote", path: path };
    if (tag === "code") {
      var cText = (target.textContent || "").trim();
      if (cText && cText.length < 30) return { name: "code: `" + cText + "`", path: path };
      return { name: "code", path: path };
    }
    if (tag === "pre") return { name: "code block", path: path };

    // Media
    if (tag === "img") {
      var alt = target.getAttribute("alt");
      return { name: alt ? 'image "' + alt.slice(0, 30) + '"' : "image", path: path };
    }
    if (tag === "video") return { name: "video", path: path };

    // Containers
    if (["div", "section", "article", "nav", "header", "footer", "aside", "main"].indexOf(tag) !== -1) {
      var className = target.className;
      var role = target.getAttribute("role");
      var cAriaLabel = target.getAttribute("aria-label");

      if (cAriaLabel) return { name: tag + " [" + cAriaLabel + "]", path: path };
      if (role) return { name: role, path: path };

      if (typeof className === "string" && className) {
        var words = className
          .split(/[\s_-]+/)
          .map(function(c) { return c.replace(/[A-Z0-9]{5,}.*$/, ""); })
          .filter(function(c) { return c.length > 2 && !/^[a-z]{1,2}$/.test(c); })
          .slice(0, 2);
        if (words.length > 0) return { name: words.join(" "), path: path };
      }

      return { name: tag === "div" ? "container" : tag, path: path };
    }

    // Turbo frame
    if (tag === "turbo-frame") {
      var frameId = target.getAttribute("id");
      return { name: frameId ? "turbo-frame#" + frameId : "turbo-frame", path: path };
    }

    return { name: tag, path: path };
  }

  // ==========================================================================
  // Selector Generation
  // ==========================================================================

  function generateSelector(element) {
    // Try data-testid first
    var testId = element.getAttribute("data-testid");
    if (testId) return '[data-testid="' + testId + '"]';

    // Try id
    if (element.id) return "#" + CSS.escape(element.id);

    var tag = element.tagName.toLowerCase();

    // Try unique class combination
    if (element.className && typeof element.className === "string") {
      var classes = element.className.split(/\s+/).filter(function(c) {
        return c.length > 0 &&
          c.indexOf(":") === -1 &&
          c.indexOf("[") === -1 &&
          !c.match(/^(p|m|w|h|flex|grid|text|bg|border|gap|space|rounded|shadow|opacity|z|top|left|right|bottom|inset)-/);
      });
      if (classes.length > 0) {
        var selector = tag + "." + classes.slice(0, 3).map(function(c) { return CSS.escape(c); }).join(".");
        try {
          if (document.querySelectorAll(selector).length === 1) return selector;
        } catch(e) { /* invalid selector */ }
      }
    }

    // Build path-based selector
    var parts = [];
    var current = element;
    var depth = 0;
    while (current && depth < 3) {
      var t = current.tagName.toLowerCase();
      if (t === "html" || t === "body") break;
      var part = t;
      if (current.id) {
        part = "#" + CSS.escape(current.id);
        parts.unshift(part);
        break;
      }
      var parent = current.parentElement;
      if (parent) {
        var siblings = Array.from(parent.children).filter(function(c) { return c.tagName === current.tagName; });
        if (siblings.length > 1) {
          var index = siblings.indexOf(current) + 1;
          part = t + ":nth-of-type(" + index + ")";
        }
      }
      parts.unshift(part);
      current = current.parentElement;
      depth++;
    }

    return parts.join(" > ");
  }

  // ==========================================================================
  // Context Capture (per detail level)
  // ==========================================================================

  function getNearbyText(element) {
    var texts = [];
    var ownText = (element.textContent || "").trim();
    if (ownText && ownText.length < 100) texts.push(ownText);

    var prev = element.previousElementSibling;
    if (prev) {
      var prevText = (prev.textContent || "").trim();
      if (prevText && prevText.length < 50) texts.unshift('[before: "' + prevText.slice(0, 40) + '"]');
    }

    var next = element.nextElementSibling;
    if (next) {
      var nextText = (next.textContent || "").trim();
      if (nextText && nextText.length < 50) texts.push('[after: "' + nextText.slice(0, 40) + '"]');
    }

    return texts.join(" ");
  }

  function getNearbyElements(element) {
    var parent = getParentElement(element);
    if (!parent || !parent.children) return "";

    var children = Array.from(parent.children);
    var siblings = children.filter(function(child) {
      return child !== element && child.tagName;
    });
    if (siblings.length === 0) return "";

    var siblingIds = siblings.slice(0, 4).map(function(sib) {
      var tag = sib.tagName.toLowerCase();
      var cls = "";
      if (typeof sib.className === "string" && sib.className) {
        var meaningful = sib.className.split(/\s+/)
          .map(function(c) { return c.replace(/[_][a-zA-Z0-9]{5,}.*$/, ""); })
          .find(function(c) { return c.length > 2 && !/^[a-z]{1,2}$/.test(c); });
        if (meaningful) cls = "." + meaningful;
      }
      if (tag === "button" || tag === "a") {
        var text = (sib.textContent || "").trim().slice(0, 15);
        if (text) return tag + cls + ' "' + text + '"';
      }
      return tag + cls;
    });

    var total = parent.children.length;
    var suffix = total > siblingIds.length + 1 ? " (" + total + " children)" : "";
    return siblingIds.join(", ") + suffix;
  }

  function getElementClasses(target) {
    var className = target.className;
    if (typeof className !== "string" || !className) return "";
    return className.split(/\s+/)
      .filter(function(c) { return c.length > 0; })
      .map(function(c) {
        var match = c.match(/^([a-zA-Z][a-zA-Z0-9_-]*?)(?:_[a-zA-Z0-9]{5,})?$/);
        return match ? match[1] : c;
      })
      .filter(function(c, i, arr) { return arr.indexOf(c) === i; })
      .join(", ");
  }

  // Computed styles — type-aware
  var TEXT_ELEMENTS = ["p", "span", "h1", "h2", "h3", "h4", "h5", "h6", "label", "li", "td", "th",
    "blockquote", "figcaption", "caption", "legend", "dt", "dd", "pre", "code",
    "em", "strong", "b", "i", "a", "time", "cite", "q"];
  var FORM_ELEMENTS = ["input", "textarea", "select"];
  var MEDIA_ELEMENTS = ["img", "video", "canvas", "svg"];
  var CONTAINER_ELEMENTS = ["div", "section", "article", "nav", "header", "footer", "aside", "main", "ul", "ol", "form", "fieldset"];
  var DEFAULT_VALUES = ["none", "normal", "auto", "0px", "rgba(0, 0, 0, 0)", "transparent", "static", "visible"];

  function getComputedStyleSnapshot(target) {
    if (typeof window === "undefined") return "";
    var styles = window.getComputedStyle(target);
    var parts = [];
    var color = styles.color;
    var bg = styles.backgroundColor;
    if (color && color !== "rgb(0, 0, 0)") parts.push("color: " + color);
    if (bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") parts.push("bg: " + bg);
    var fontSize = styles.fontSize;
    var fontWeight = styles.fontWeight;
    if (fontSize) parts.push("font: " + fontSize);
    if (fontWeight && fontWeight !== "400" && fontWeight !== "normal") parts.push("weight: " + fontWeight);
    var padding = styles.padding;
    var margin = styles.margin;
    if (padding && padding !== "0px") parts.push("padding: " + padding);
    if (margin && margin !== "0px") parts.push("margin: " + margin);
    var display = styles.display;
    var position = styles.position;
    if (display && display !== "block" && display !== "inline") parts.push("display: " + display);
    if (position && position !== "static") parts.push("position: " + position);
    var borderRadius = styles.borderRadius;
    if (borderRadius && borderRadius !== "0px") parts.push("radius: " + borderRadius);
    return parts.join(", ");
  }

  function getDetailedComputedStyles(target) {
    if (typeof window === "undefined") return {};
    var styles = window.getComputedStyle(target);
    var result = {};
    var tag = target.tagName.toLowerCase();
    var properties;

    if (TEXT_ELEMENTS.indexOf(tag) !== -1) {
      properties = ["color", "fontSize", "fontWeight", "fontFamily", "lineHeight"];
    } else if (tag === "button" || (tag === "a" && target.getAttribute("role") === "button")) {
      properties = ["backgroundColor", "color", "padding", "borderRadius", "fontSize"];
    } else if (FORM_ELEMENTS.indexOf(tag) !== -1) {
      properties = ["backgroundColor", "color", "padding", "borderRadius", "fontSize"];
    } else if (MEDIA_ELEMENTS.indexOf(tag) !== -1) {
      properties = ["width", "height", "objectFit", "borderRadius"];
    } else if (CONTAINER_ELEMENTS.indexOf(tag) !== -1) {
      properties = ["display", "padding", "margin", "gap", "backgroundColor"];
    } else {
      properties = ["color", "fontSize", "margin", "padding", "backgroundColor"];
    }

    properties.forEach(function(prop) {
      var cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
      var value = styles.getPropertyValue(cssProp);
      if (value && DEFAULT_VALUES.indexOf(value) === -1) {
        result[prop] = value;
      }
    });

    return result;
  }

  var FORENSIC_PROPERTIES = [
    "color", "backgroundColor", "borderColor",
    "fontSize", "fontWeight", "fontFamily", "lineHeight", "letterSpacing", "textAlign",
    "width", "height", "padding", "margin", "border", "borderRadius",
    "display", "position", "top", "right", "bottom", "left", "zIndex",
    "flexDirection", "justifyContent", "alignItems", "gap",
    "opacity", "visibility", "overflow", "boxShadow", "transform"
  ];

  function getForensicComputedStyles(target) {
    if (typeof window === "undefined") return "";
    var styles = window.getComputedStyle(target);
    var parts = [];
    FORENSIC_PROPERTIES.forEach(function(prop) {
      var cssProp = prop.replace(/([A-Z])/g, "-$1").toLowerCase();
      var value = styles.getPropertyValue(cssProp);
      if (value && DEFAULT_VALUES.indexOf(value) === -1) {
        parts.push(cssProp + ": " + value);
      }
    });
    return parts.join("; ");
  }

  function getAccessibilityInfo(target) {
    var parts = [];
    var role = target.getAttribute("role");
    var ariaLabel = target.getAttribute("aria-label");
    var ariaDescribedBy = target.getAttribute("aria-describedby");
    var tabIndex = target.getAttribute("tabindex");
    var ariaHidden = target.getAttribute("aria-hidden");

    if (role) parts.push('role="' + role + '"');
    if (ariaLabel) parts.push('aria-label="' + ariaLabel + '"');
    if (ariaDescribedBy) parts.push('aria-describedby="' + ariaDescribedBy + '"');
    if (tabIndex) parts.push("tabindex=" + tabIndex);
    if (ariaHidden === "true") parts.push("aria-hidden");

    try {
      if (target.matches("a, button, input, select, textarea, [tabindex]")) parts.push("focusable");
    } catch(e) { /* */ }

    return parts.join(", ");
  }

  function getFullElementPath(target) {
    var parts = [];
    var current = target;

    while (current && current.tagName && current.tagName.toLowerCase() !== "html") {
      var tag = current.tagName.toLowerCase();
      var identifier = tag;

      if (current.id) {
        identifier = tag + "#" + current.id;
      } else if (current.className && typeof current.className === "string") {
        var cls = current.className.split(/\s+/)
          .map(function(c) { return c.replace(/[_][a-zA-Z0-9]{5,}.*$/, ""); })
          .find(function(c) { return c.length > 2; });
        if (cls) identifier = tag + "." + cls;
      }

      var nextParent = getParentElement(current);
      if (!current.parentElement && nextParent) {
        identifier = "\u27E8shadow\u27E9 " + identifier;
      }

      parts.unshift(identifier);
      current = nextParent;
    }

    return parts.join(" > ");
  }

  // ==========================================================================
  // Rails-Specific Context Detection
  // ==========================================================================

  // Walk backwards through siblings looking for HTML comments
  function findCommentAbove(element, pattern) {
    var node = element;
    while (node) {
      var sibling = node.previousSibling;
      while (sibling) {
        if (sibling.nodeType === 8) { // Comment node
          var match = sibling.textContent.match(pattern);
          if (match) return match[1];
        }
        // Stop if we hit a non-whitespace text or element node
        if (sibling.nodeType === 1) break;
        sibling = sibling.previousSibling;
      }
      node = node.parentElement;
    }
    return null;
  }

  // ViewComponent source comments: <!-- BEGIN app/components/... -->
  function getViewComponentPath(element) {
    return findCommentAbove(element, /BEGIN\s+(app\/components\/.*\.erb)/);
  }

  // Rails view annotations: <!-- BEGIN /full/path/app/views/... -->
  function getPartialPath(element) {
    return findCommentAbove(element, /BEGIN\s+(?:\/[^\s]*?)?(app\/views\/.*\.erb)/);
  }

  // Walk up DOM for data-controller attributes (Stimulus)
  function getStimulusControllers(element) {
    var controllers = [];
    var current = element;
    while (current) {
      var ctrl = current.getAttribute && current.getAttribute("data-controller");
      if (ctrl) {
        ctrl.split(/\s+/).forEach(function(c) {
          if (c && controllers.indexOf(c) === -1) controllers.push(c);
        });
      }
      current = current.parentElement;
    }
    return controllers.length > 0 ? controllers.join(", ") : null;
  }

  // Find enclosing turbo-frame
  function getTurboFrameId(element) {
    var current = element;
    while (current) {
      if (current.tagName && current.tagName.toLowerCase() === "turbo-frame") {
        return current.getAttribute("id");
      }
      current = current.parentElement;
    }
    return null;
  }

  // Get non-framework data-* attributes
  function getDataAttributes(element) {
    var attrs = {};
    if (!element.attributes) return attrs;
    for (var i = 0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];
      if (attr.name.indexOf("data-") === 0 &&
          attr.name !== "data-controller" &&
          attr.name !== "data-action" &&
          attr.name.indexOf("data-agentation") !== 0 &&
          !attr.name.match(/^data-[a-z]+-target$/) &&
          !attr.name.match(/^data-[a-z]+-[a-z]+-value$/)) {
        attrs[attr.name] = attr.value;
      }
    }
    return attrs;
  }

  // ==========================================================================
  // Full Capture (detail-level aware)
  // ==========================================================================

  function captureElement(element, detailLevel) {
    detailLevel = detailLevel || "standard";
    var identified = identifyElement(element);
    var selector = generateSelector(element);

    // Compact: just name, selector, path
    var data = {
      elementName: identified.name,
      selector: selector,
      path: identified.path
    };

    // Standard+: add classes, nearby text, Rails context
    if (detailLevel !== "compact") {
      data.classes = getElementClasses(element);
      data.nearbyText = getNearbyText(element);
      data.stimulus = getStimulusControllers(element);
      data.turboFrame = getTurboFrameId(element);
      data.componentPath = getViewComponentPath(element);
      data.partialPath = getPartialPath(element);
    }

    // Detailed+: add computed styles, accessibility, nearby elements
    if (detailLevel === "detailed" || detailLevel === "forensic") {
      data.computedStyles = getDetailedComputedStyles(element);
      data.accessibility = getAccessibilityInfo(element);
      data.nearbyElements = getNearbyElements(element);
    }

    // Forensic: add full path, all data attrs, complete style dump
    if (detailLevel === "forensic") {
      data.fullPath = getFullElementPath(element);
      data.dataAttributes = getDataAttributes(element);
      data.allStyles = getForensicComputedStyles(element);
    }

    return data;
  }

  return {
    identifyElement: identifyElement,
    generateSelector: generateSelector,
    getElementPath: getElementPath,
    getNearbyText: getNearbyText,
    getNearbyElements: getNearbyElements,
    getElementClasses: getElementClasses,
    getComputedStyleSnapshot: getComputedStyleSnapshot,
    getDetailedComputedStyles: getDetailedComputedStyles,
    getForensicComputedStyles: getForensicComputedStyles,
    getAccessibilityInfo: getAccessibilityInfo,
    getFullElementPath: getFullElementPath,
    getStimulusControllers: getStimulusControllers,
    getTurboFrameId: getTurboFrameId,
    getViewComponentPath: getViewComponentPath,
    getPartialPath: getPartialPath,
    getDataAttributes: getDataAttributes,
    captureElement: captureElement,
    closestCrossingShadow: closestCrossingShadow,
    getParentElement: getParentElement
  };
})();
