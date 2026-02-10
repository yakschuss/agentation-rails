// output.js — Generate structured markdown from annotations at 4 detail levels.

var AgentationOutput = (function() {

  function generateOutput(annotations, detailLevel) {
    detailLevel = detailLevel || "standard";
    if (!annotations || annotations.length === 0) return "";

    var lines = [];
    lines.push("# UI Annotations");
    lines.push("");
    lines.push("_" + annotations.length + " annotation" + (annotations.length === 1 ? "" : "s") + " captured at " + window.location.pathname + "_");
    lines.push("");

    annotations.forEach(function(annotation, index) {
      lines.push(formatAnnotation(annotation, index, detailLevel));
    });

    return lines.join("\n");
  }

  function formatAnnotation(annotation, index, detailLevel) {
    var lines = [];
    var num = index + 1;

    // Header
    lines.push("## " + num + ". " + (annotation.elementName || "Element"));

    // Intent + comment
    if (annotation.intent) {
      var prefix = annotation.intent === "question" ? "?" :
                   annotation.intent === "approve" ? "approve" :
                   annotation.intent;
      lines.push(prefix + ": " + (annotation.comment || "(no comment)"));
    } else if (annotation.comment) {
      lines.push(annotation.comment);
    }

    // Selected text
    if (annotation.selectedText) {
      lines.push('> "' + annotation.selectedText.slice(0, 200) + '"');
    }

    // Multi-select info
    if (annotation.isMultiSelect && annotation.multiSelectElements) {
      lines.push("- **Selected elements:** " + annotation.multiSelectElements.length);
      annotation.multiSelectElements.slice(0, 5).forEach(function(el) {
        lines.push("  - " + el.name);
      });
      if (annotation.multiSelectElements.length > 5) {
        lines.push("  - ...and " + (annotation.multiSelectElements.length - 5) + " more");
      }
    }

    // Compact: stop here
    if (detailLevel === "compact") {
      lines.push("");
      return lines.join("\n");
    }

    // Standard+: selector, classes, path, nearby text, Rails context
    if (annotation.selector) {
      lines.push("- **Selector:** `" + annotation.selector + "`");
    }
    if (annotation.classes) {
      lines.push("- **Classes:** " + annotation.classes);
    }
    if (annotation.path) {
      lines.push("- **Path:** " + annotation.path);
    }
    if (annotation.nearbyText) {
      lines.push("- **Nearby text:** " + annotation.nearbyText.slice(0, 100));
    }

    // Rails context
    if (annotation.stimulus) {
      lines.push("- **Stimulus:** " + annotation.stimulus);
    }
    if (annotation.turboFrame) {
      lines.push("- **Turbo Frame:** " + annotation.turboFrame);
    }
    if (annotation.componentPath) {
      lines.push("- **Component:** `" + annotation.componentPath + "`");
    }
    if (annotation.partialPath) {
      lines.push("- **Partial:** `" + annotation.partialPath + "`");
    }

    // Detailed+: computed styles, accessibility, nearby elements
    if (detailLevel === "detailed" || detailLevel === "forensic") {
      if (annotation.computedStyles && Object.keys(annotation.computedStyles).length > 0) {
        var styleStr = Object.keys(annotation.computedStyles).map(function(key) {
          return key.replace(/([A-Z])/g, "-$1").toLowerCase() + ": " + annotation.computedStyles[key];
        }).join("; ");
        lines.push("- **Styles:** " + styleStr);
      }
      if (annotation.accessibility) {
        lines.push("- **Accessibility:** " + annotation.accessibility);
      }
      if (annotation.nearbyElements) {
        lines.push("- **Nearby elements:** " + annotation.nearbyElements);
      }
    }

    // Forensic: full path, data attrs, complete style dump
    if (detailLevel === "forensic") {
      if (annotation.fullPath) {
        lines.push("- **Full path:** " + annotation.fullPath);
      }
      if (annotation.dataAttributes && Object.keys(annotation.dataAttributes).length > 0) {
        var attrStr = Object.keys(annotation.dataAttributes).map(function(key) {
          return key + '="' + annotation.dataAttributes[key] + '"';
        }).join(", ");
        lines.push("- **Data attributes:** " + attrStr);
      }
      if (annotation.allStyles) {
        lines.push("- **All styles:** " + annotation.allStyles);
      }
    }

    lines.push("");
    return lines.join("\n");
  }

  return {
    generateOutput: generateOutput,
    formatAnnotation: formatAnnotation
  };
})();
