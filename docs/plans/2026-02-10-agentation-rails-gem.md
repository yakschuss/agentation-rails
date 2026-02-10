# Agentation Rails Gem Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a zero-config Rails gem that injects the Agentation visual feedback toolbar into any Rails app via Rack middleware. Full feature parity with the npm agentation package, plus Rails-specific context (Stimulus, Turbo, ViewComponent, partials).

**Architecture:** Rack middleware intercepts HTML responses and injects a self-contained `<script>` tag before `</body>`. The script is a single IIFE containing all JS + CSS (no external assets). No dependency on the host app's asset pipeline, Stimulus, React, or any framework. Gem has zero runtime dependencies beyond `rack`.

**Tech Stack:** Ruby gem with Railtie, vanilla JavaScript (ES2020+), CSS-in-JS (injected `<style>` tags)

---

## Task 1: Gem Scaffold & Middleware

**Files:**
- Create: `lib/agentation.rb`
- Create: `lib/agentation/version.rb`
- Create: `lib/agentation/configuration.rb`
- Create: `lib/agentation/middleware.rb`
- Create: `lib/agentation/railtie.rb`
- Create: `lib/agentation/script_builder.rb`
- Create: `agentation-rails.gemspec`
- Create: `Gemfile`
- Create: `Rakefile`
- Create: `LICENSE`
- Test: `spec/agentation/middleware_spec.rb`
- Test: `spec/spec_helper.rb`

**Step 1: Create gemspec**

```ruby
# agentation-rails.gemspec
Gem::Specification.new do |spec|
  spec.name          = "agentation-rails"
  spec.version       = Agentation::VERSION
  spec.authors       = ["Your Name"]
  spec.summary       = "Visual feedback tool for AI coding agents"
  spec.description   = "Rack middleware that injects a visual annotation toolbar for capturing element selectors, styles, and context to share with AI agents."
  spec.homepage      = "https://github.com/yourname/agentation-rails"
  spec.license       = "MIT"
  spec.required_ruby_version = ">= 3.1"

  spec.files = Dir["lib/**/*", "app/**/*", "LICENSE", "README.md"]
  spec.require_paths = ["lib"]

  spec.add_dependency "rack", ">= 2.0"
  spec.add_development_dependency "rspec", "~> 3.0"
  spec.add_development_dependency "rack-test", "~> 2.0"
  spec.add_development_dependency "rake", "~> 13.0"
end
```

**Step 2: Create version, configuration, and entry point**

```ruby
# lib/agentation/version.rb
module Agentation
  VERSION = "0.1.0"
end

# lib/agentation/configuration.rb
module Agentation
  class Configuration
    attr_accessor :enabled, :default_detail, :color

    def initialize
      @enabled = nil # auto-detect: true in development
      @default_detail = :standard
      @color = "#3c82f7"
    end

    def enabled?
      if @enabled.nil?
        defined?(Rails) ? Rails.env.development? : false
      else
        @enabled
      end
    end
  end
end

# lib/agentation.rb
require "agentation/version"
require "agentation/configuration"

module Agentation
  class << self
    def configuration
      @configuration ||= Configuration.new
    end

    def configure
      yield(configuration)
    end

    def enabled?
      configuration.enabled?
    end
  end
end

require "agentation/railtie" if defined?(Rails::Railtie)
```

**Step 3: Create middleware**

```ruby
# lib/agentation/middleware.rb
require "agentation/script_builder"

module Agentation
  class Middleware
    def initialize(app)
      @app = app
    end

    def call(env)
      status, headers, body = @app.call(env)

      if inject?(status, headers)
        new_body = inject_script(body)
        headers.delete("content-length")
        [status, headers, [new_body]]
      else
        [status, headers, body]
      end
    end

    private

    def inject?(status, headers)
      return false unless Agentation.enabled?
      return false unless status == 200
      return false unless html_response?(headers)
      true
    end

    def html_response?(headers)
      content_type = headers["content-type"] || headers["Content-Type"] || ""
      content_type.include?("text/html")
    end

    def inject_script(body)
      html = body_to_string(body)
      script_tag = ScriptBuilder.build
      html.sub(%r{</body>}i, "#{script_tag}\n</body>")
    end

    def body_to_string(body)
      str = +""
      body.each { |chunk| str << chunk }
      body.close if body.respond_to?(:close)
      str
    end
  end
end
```

**Step 4: Create Railtie**

```ruby
# lib/agentation/railtie.rb
module Agentation
  class Railtie < Rails::Railtie
    initializer "agentation.configure_middleware" do |app|
      require "agentation/middleware"
      app.middleware.use Agentation::Middleware
    end
  end
end
```

**Step 5: Create ScriptBuilder (placeholder)**

```ruby
# lib/agentation/script_builder.rb
module Agentation
  class ScriptBuilder
    def self.build
      script = File.read(File.expand_path("../../app/assets/javascripts/agentation/agentation.js", __dir__))
      %(<script data-agentation="true">#{script}</script>)
    end
  end
end
```

**Step 6: Write middleware spec**

```ruby
# spec/spec_helper.rb
require "rack/test"
require "agentation"
require "agentation/middleware"

RSpec.configure do |config|
  config.include Rack::Test::Methods
end

# spec/agentation/middleware_spec.rb
require "spec_helper"

RSpec.describe Agentation::Middleware do
  let(:html_body) { "<html><body><h1>Hello</h1></body></html>" }
  let(:inner_app) do
    lambda { |_env| [200, {"content-type" => "text/html"}, [html_body]] }
  end
  let(:app) { described_class.new(inner_app) }

  before { Agentation.configuration.enabled = true }

  describe "#call" do
    it "injects script tag before </body>" do
      status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
      response_body = body.first

      expect(status).to eq(200)
      expect(response_body).to include('<script data-agentation="true">')
      expect(response_body).to include("</script>\n</body>")
    end

    it "removes content-length header" do
      _status, headers, _body = app.call(Rack::MockRequest.env_for("/"))
      expect(headers).not_to have_key("content-length")
    end

    it "skips non-HTML responses" do
      json_app = lambda { |_env| [200, {"content-type" => "application/json"}, ['{"ok":true}']] }
      middleware = described_class.new(json_app)

      _status, _headers, body = middleware.call(Rack::MockRequest.env_for("/"))
      expect(body.first).to eq('{"ok":true}')
    end

    it "skips when disabled" do
      Agentation.configuration.enabled = false

      _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
      expect(body.first).not_to include("data-agentation")
    end

    it "skips non-200 responses" do
      error_app = lambda { |_env| [404, {"content-type" => "text/html"}, ["<html><body>Not Found</body></html>"]] }
      middleware = described_class.new(error_app)

      _status, _headers, body = middleware.call(Rack::MockRequest.env_for("/"))
      expect(body.first).not_to include("data-agentation")
    end
  end
end
```

**Step 7: Run specs to verify they fail (no JS file yet)**

Run: `cd ~/Code/agentation-rails && bundle exec rspec`
Expected: Fail (missing JS file)

**Step 8: Create placeholder JS file**

```javascript
// app/assets/javascripts/agentation/agentation.js
(function() { console.log("[agentation] loaded"); })();
```

**Step 9: Run specs again**

Run: `cd ~/Code/agentation-rails && bundle exec rspec`
Expected: All pass

**Step 10: Commit**

```bash
git add -A
git commit -m "Scaffold gem with Railtie, middleware, and specs"
```

---

## Task 2: Styles Module

**Files:**
- Create: `app/assets/javascripts/agentation/styles.js`

All CSS is defined as JS strings and injected via a `<style>` tag at runtime. No external stylesheet dependencies.

**Step 1: Create styles.js**

Port the full CSS from agentation's two SCSS modules (~1,250 lines combined) into a JS module that exports CSS strings. Key sections:

- Toolbar styles (floating button, expanded panel, settings)
- Annotation popup styles (form, accordion, animations)
- Marker styles (numbered dots, hover highlights)
- Overlay styles (hover highlight, multi-select rectangle, area select)
- Animation keyframes (entrance, exit, shake, scale, fade, slide)
- Dark/light mode CSS custom properties
- Freeze mode styles (animation-play-state, transition: none)
- Utility styles (cursor: crosshair when active)

Must include `[data-agentation-toolbar]` prefix on all selectors to prevent style leakage into host app.

The styles module exports a single `injectStyles()` function that creates a `<style id="agentation-styles">` element and appends it to `<head>`.

**Step 2: Commit**

```bash
git add -A
git commit -m "Add styles module with full CSS-in-JS"
```

---

## Task 3: Element Identification & Rails Context

**Files:**
- Create: `app/assets/javascripts/agentation/identifier.js`

Port agentation's `element-identification.ts` (~900 lines) to vanilla JS. Add Rails-specific context detection.

**Key functions to implement:**

```javascript
// Core identification
identifyElement(element)        // → { name, path }
getElementPath(element, depth)  // → "main > .card > button"
generateSelector(element)       // → unique CSS selector

// Context capture (per detail level)
getNearbyText(element)          // → surrounding text content
getNearbyElements(element)      // → sibling element descriptions
getElementClasses(element)      // → cleaned class list
getComputedStyleSnapshot(el)    // → relevant CSS properties
getAccessibilityInfo(element)   // → ARIA roles, labels, focusable
getFullElementPath(element)     // → complete ancestry to html

// Rails-specific (NEW - not in agentation)
getStimulusControllers(element) // → walk up DOM for data-controller
getTurboFrameId(element)        // → enclosing turbo-frame id
getViewComponentPath(element)   // → parse <!-- BEGIN ... --> comments
getPartialPath(element)         // → parse Rails view annotations
getDataAttributes(element)      // → non-framework data-* attrs

// Shadow DOM helpers
closestCrossingShadow(element, selector)
getParentElement(element)       // crosses shadow boundaries
```

**Rails context detection approach:**

```javascript
// ViewComponent source comments (development mode)
// Rails renders: <!-- BEGIN app/components/members/foo_component.html.erb -->
function getViewComponentPath(element) {
  let node = element;
  while (node) {
    let sibling = node.previousSibling;
    while (sibling) {
      if (sibling.nodeType === 8) { // Comment node
        const match = sibling.textContent.match(/BEGIN\s+(app\/components\/.*\.erb)/);
        if (match) return match[1];
      }
      sibling = sibling.previousSibling;
    }
    node = node.parentElement;
  }
  return null;
}

// Partial source comments (config.action_view.annotate_rendered_view_with_filenames)
// Rails renders: <!-- BEGIN /app/views/members/... -->
function getPartialPath(element) {
  // Same approach, match app/views/ pattern
}
```

**Step 1: Implement identifier.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add element identification with Rails context detection"
```

---

## Task 4: Storage Module

**Files:**
- Create: `app/assets/javascripts/agentation/storage.js`

Port agentation's `storage.ts` (~140 lines) to vanilla JS.

**Key functions:**

```javascript
const STORAGE_PREFIX = "agentation:";
const RETENTION_DAYS = 7;

function loadAnnotations(pathname)           // → Annotation[]
function saveAnnotations(pathname, annotations)
function clearAnnotations(pathname)
function loadAllAnnotations()                // → Map<pathname, Annotation[]>
function loadSettings()                      // → ToolbarSettings
function saveSettings(settings)
function loadTheme()                         // → "dark" | "light"
function saveTheme(theme)
```

Storage keys:
- Annotations: `agentation:{pathname}`
- Settings: `agentation:__settings__`
- Theme: `agentation:__theme__`

Include 7-day TTL cleanup on load. Graceful error handling for full/disabled localStorage.

**Step 1: Implement storage.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add localStorage persistence with TTL cleanup"
```

---

## Task 5: Freeze Animations Module

**Files:**
- Create: `app/assets/javascripts/agentation/freeze.js`

Port agentation's `freeze-animations.ts` (~250 lines) to vanilla JS. This is the deep freeze that patches `setTimeout`, `setInterval`, and `requestAnimationFrame`.

**Key functions:**

```javascript
function freeze()    // Pause everything
function unfreeze()  // Resume everything + replay queued callbacks

// Exported for internal use (bypass patches)
const originalSetTimeout = window.setTimeout.bind(window)
const originalSetInterval = window.setInterval.bind(window)
```

**Freeze mechanism:**
1. Monkey-patch `setTimeout` → queue callbacks when frozen
2. Monkey-patch `setInterval` → skip callbacks when frozen
3. Monkey-patch `requestAnimationFrame` → queue when frozen
4. Inject CSS: `animation-play-state: paused !important; transition: none !important;`
5. Pause WAAPI animations via `document.getAnimations().forEach(a => a.pause())`
6. Pause `<video>` elements
7. Exclude agentation UI elements via `[data-agentation-toolbar]` selector

**Unfreeze:**
1. Replay queued setTimeout callbacks asynchronously
2. Replay queued rAF callbacks on next frame
3. Resume WAAPI animations via `.play()`
4. Resume videos
5. Remove injected CSS

State lives on `window.__agentation_freeze` to survive hot reloads.

**Step 1: Implement freeze.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add deep freeze for animations, timers, and videos"
```

---

## Task 6: Overlay Module

**Files:**
- Create: `app/assets/javascripts/agentation/overlay.js`

Hover highlight overlay that follows the cursor target, plus selection rectangles for multi-select and area selection.

**Key functions:**

```javascript
function createOverlay()              // Create DOM elements
function showHoverOverlay(element)    // Blue border + translucent fill on element
function hideHoverOverlay()
function showSelectionRect(x1, y1, x2, y2)  // Drag rectangle
function hideSelectionRect()
function flashOverlay(element, color) // Brief green flash on capture
function highlightElements(boundingBoxes)   // Multi-select hover
function clearHighlights()
function destroy()                    // Remove all DOM elements
```

Overlay elements are absolutely positioned divs with high z-index. Use `element.getBoundingClientRect()` for positioning. Must handle scroll offset for non-fixed elements.

**Step 1: Implement overlay.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add hover overlay and selection rectangle"
```

---

## Task 7: Markers Module

**Files:**
- Create: `app/assets/javascripts/agentation/markers.js`

Numbered annotation dots placed at element positions on the page.

**Key functions:**

```javascript
function createMarker(annotation, index)  // Place numbered dot
function updateMarkers(annotations)       // Re-render all markers
function setMarkersVisible(visible)       // Show/hide toggle
function removeMarker(annotationId)
function clearMarkers()
function destroy()
```

Each marker is:
- A circular SVG with a number
- Positioned at annotation's (x, y) coordinates
- `position: fixed` if annotation.isFixed, else `position: absolute`
- Colored with the configured accent color
- Entrance/exit CSS animations
- Clicking a marker opens edit popup for that annotation
- Has `data-agentation-marker` attribute (excluded from freeze)

**Step 1: Implement markers.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add numbered annotation markers"
```

---

## Task 8: Popup Module

**Files:**
- Create: `app/assets/javascripts/agentation/popup.js`

Comment popup that appears after element capture.

**Key functions:**

```javascript
function showPopup(options)  // Show popup at position
// options: { x, y, elementName, selectedText, initialValue, computedStyles, onSubmit, onCancel, onDelete }
function hidePopup()
function shakePopup()        // Shake animation (click outside)
function isPopupVisible()
function destroy()
```

**Popup UI structure:**
```
┌─────────────────────────────┐
│ button "Save changes"       │  ← element name header
│ ┌─ Computed Styles ───────┐ │  ← collapsible accordion (Detailed+)
│ │ font-size: 16px         │ │
│ │ padding: 8px 16px       │ │
│ └─────────────────────────┘ │
│ "selected text quote"       │  ← if text was selected
│ ┌─────────────────────────┐ │
│ │ What should change?     │ │  ← textarea
│ └─────────────────────────┘ │
│ [fix] [change] [?] [ok]    │  ← intent pills
│              [Add]  [Delete]│  ← submit + optional delete
└─────────────────────────────┘
```

**Keyboard:** Enter = submit, Shift+Enter = newline, Escape = cancel
**Animation:** CSS entrance (scale + fade), exit (scale down), shake on outside click
**Positioning:** Placed near click point, flips if near viewport edges

**Step 1: Implement popup.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add annotation comment popup"
```

---

## Task 9: Output / Markdown Generation

**Files:**
- Create: `app/assets/javascripts/agentation/output.js`

Generates structured markdown from annotations at four detail levels.

**Key functions:**

```javascript
function generateOutput(annotations, detailLevel)  // → markdown string
function formatAnnotation(annotation, index, detailLevel)  // → single annotation markdown
```

**Output by detail level:**

```markdown
# Compact
## 1. button "Save changes"
fix: Spacing is off

# Standard (adds: classes, nearby text, path, Rails context)
## 1. button "Save changes"
fix: Spacing is off
- **Selector:** `[data-testid="save-btn"]`
- **Classes:** prism-button, prism-button--primary
- **Path:** main > .card > form > button
- **Nearby text:** "Cancel | Save changes | ..."
- **Stimulus:** form, modal
- **Turbo Frame:** care-case-form
- **Component:** app/components/members/save_button_component.html.erb

# Detailed (adds: computed styles, accessibility, nearby elements)
## 1. button "Save changes"
... (all Standard fields) ...
- **Styles:** font-size: 16px; padding: 8px 16px; background: #3b82f6
- **Accessibility:** role=button, aria-label='Save changes', focusable
- **Nearby elements:** form.care-case-form, div.button-group, a.cancel-link

# Forensic (adds: full path, all data attrs, complete style dump)
## 1. button "Save changes"
... (all Detailed fields) ...
- **Full path:** html > body > main > div.content > form > div.actions > button
- **Data attributes:** data-turbo-method="patch", data-disable-with="Saving..."
- **All styles:** (comprehensive computed style dump)
```

**Step 1: Implement output.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add markdown output generation with 4 detail levels"
```

---

## Task 10: Selection Modes (Annotator)

**Files:**
- Create: `app/assets/javascripts/agentation/annotator.js`

Handles all four selection modes: click, text selection, multi-select drag, and area selection.

**Key functions:**

```javascript
function activate(options)    // Start listening for interactions
// options: { onCapture, detailLevel, overlay, identifier }
function deactivate()         // Stop listening
function isActive()

// Internal handlers
function handleMouseDown(event)
function handleMouseUp(event)
function handleMouseMove(event)
function handleSelectionChange()
```

**Mode detection (based on modifier keys + gesture):**

| Gesture | Mode | Result |
|---------|------|--------|
| Click (no modifier) | Click | Single element capture |
| Text drag (no modifier) | Text selection | Selected text + container element |
| Shift + drag | Multi-select | All elements in rectangle |
| Alt/Option + drag | Area selection | Region coordinates + contained elements |

**Click mode flow:**
1. `mousedown` → record start position
2. `mouseup` → if distance < 5px (not a drag), treat as click
3. Identify element at click point
4. Capture all metadata (respecting detail level)
5. Call `onCapture(annotationData)` callback

**Text selection flow:**
1. Detect `selectionchange` event
2. If selection is non-empty and within annotated area
3. Show small "Annotate" bubble near selection
4. On click: capture selected text + containing element
5. Call `onCapture` with `selectedText` field

**Multi-select flow:**
1. `mousedown` with Shift held → start drag
2. `mousemove` → draw selection rectangle via overlay
3. `mouseup` → find all elements intersecting rectangle
4. Capture as single annotation with `isMultiSelect: true`
5. `elementBoundingBoxes` array for hover highlighting

**Area select flow:**
1. `mousedown` with Alt held → start drag
2. `mousemove` → draw selection rectangle
3. `mouseup` → capture region + any contained elements
4. Annotation has boundingBox but may have empty element name

**Step 1: Implement annotator.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add selection modes: click, text, multi-select, area"
```

---

## Task 11: Settings Panel

**Files:**
- Create: `app/assets/javascripts/agentation/settings.js`

Settings panel UI that opens from the toolbar gear icon.

**Key functions:**

```javascript
function createSettingsPanel(options)  // Build DOM
function showSettings()
function hideSettings()
function getSettings()                // → current ToolbarSettings
function destroy()
```

**Settings:**

| Setting | Type | Options | Default |
|---------|------|---------|---------|
| Output detail | Radio | Compact / Standard / Detailed / Forensic | Standard |
| Annotation color | Color pills | Purple / Blue / Cyan / Green / Yellow / Orange | Blue |
| Auto-clear after copy | Toggle | on/off | off |
| Marker click behavior | Radio | Edit / Delete | Edit |
| Block interactions | Toggle | on/off (prevent clicks reaching host app) | on |

Settings persisted to localStorage via storage module.

**Step 1: Implement settings.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add settings panel with persistence"
```

---

## Task 12: Toolbar (Main Controller)

**Files:**
- Create: `app/assets/javascripts/agentation/toolbar.js`

The main toolbar UI and controller that orchestrates all modules.

**Key functions:**

```javascript
function createToolbar(config)  // Initialize everything
function destroy()              // Clean teardown

// Internal
function renderToolbar()        // Build toolbar DOM
function handleToggle()         // Activate/deactivate
function handleCopy()           // Generate + copy markdown
function handleClear()          // Clear all annotations
function handleFreeze()         // Toggle animation freeze
function handleTheme()          // Toggle dark/light mode
function handleMarkerToggle()   // Show/hide markers
function handleAnnotationSubmit(data)  // From popup → save annotation
function navigateAnnotations(direction) // Prev/next annotation
```

**Toolbar UI structure (collapsed):**
```
[magnifying glass icon]  ← circular floating button, bottom-right
```

**Toolbar UI structure (expanded):**
```
┌──────────────────────────────────────┐
│ [pause] [markers] [theme] [settings] │  ← action buttons
│                                      │
│  Annotation 1 of 3  [<] [>]         │  ← navigation (if annotations exist)
│  button "Save"                       │
│  "Spacing is off"                    │
│                                      │
│  [Copy]  [Clear]           [Close]   │  ← main actions
│                                      │
│  Captured: 3                         │  ← counter badge
└──────────────────────────────────────┘
```

**Toolbar attributes:** `data-agentation-toolbar` on root element (used by freeze exclusion).

**Step 1: Implement toolbar.js**
**Step 2: Commit**

```bash
git add -A
git commit -m "Add main toolbar controller"
```

---

## Task 13: Main Entry Point (IIFE Bundle)

**Files:**
- Modify: `app/assets/javascripts/agentation/agentation.js`

Wire all modules together into a single self-executing IIFE.

**Step 1: Create the main entry point**

The IIFE structure:

```javascript
(function() {
  "use strict";

  // === Module: styles ===
  // (inline styles.js content)

  // === Module: storage ===
  // (inline storage.js content)

  // === Module: freeze ===
  // (inline freeze.js content)

  // === Module: identifier ===
  // (inline identifier.js content)

  // === Module: overlay ===
  // (inline overlay.js content)

  // === Module: markers ===
  // (inline markers.js content)

  // === Module: popup ===
  // (inline popup.js content)

  // === Module: output ===
  // (inline output.js content)

  // === Module: annotator ===
  // (inline annotator.js content)

  // === Module: settings ===
  // (inline settings.js content)

  // === Module: toolbar ===
  // (inline toolbar.js content)

  // === Bootstrap ===
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    createToolbar({
      defaultDetail: document.querySelector("[data-agentation]")?.dataset.agentationDetail || "standard",
      color: document.querySelector("[data-agentation]")?.dataset.agentationColor || "#3c82f7"
    });
  }
})();
```

**Step 2: Create a build script**

```ruby
# lib/agentation/script_builder.rb (updated)
module Agentation
  class ScriptBuilder
    MODULES = %w[
      styles storage freeze identifier overlay
      markers popup output annotator settings toolbar
    ].freeze

    def self.build
      @cached_script ||= compile
      %(<script data-agentation="true" data-agentation-detail="#{Agentation.configuration.default_detail}" data-agentation-color="#{Agentation.configuration.color}">#{@cached_script}</script>)
    end

    def self.compile
      js_dir = File.expand_path("../../app/assets/javascripts/agentation", __dir__)

      modules = MODULES.map do |mod|
        content = File.read(File.join(js_dir, "#{mod}.js"))
        "// === Module: #{mod} ===\n#{content}"
      end

      <<~JS
        (function() {
          "use strict";
          #{modules.join("\n\n")}

          // === Bootstrap ===
          var scriptTag = document.querySelector("[data-agentation]");
          var config = {
            defaultDetail: (scriptTag && scriptTag.dataset.agentationDetail) || "standard",
            color: (scriptTag && scriptTag.dataset.agentationColor) || "#3c82f7"
          };

          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", function() { Agentation.init(config); });
          } else {
            Agentation.init(config);
          }
        })();
      JS
    end

    def self.clear_cache!
      @cached_script = nil
    end
  end
end
```

**Step 3: Commit**

```bash
git add -A
git commit -m "Wire all modules into IIFE bundle with ScriptBuilder"
```

---

## Task 14: Integration Testing

**Files:**
- Create: `spec/integration/full_stack_spec.rb`

**Step 1: Write integration spec**

Test the full flow: middleware injects script, script initializes toolbar.

```ruby
# spec/integration/full_stack_spec.rb
require "spec_helper"

RSpec.describe "Full stack integration" do
  let(:html_body) do
    <<~HTML
      <html>
        <head><title>Test</title></head>
        <body>
          <div data-controller="tabs">
            <button data-testid="save-btn">Save</button>
            <turbo-frame id="content">
              <p class="prism-text-regular">Hello world</p>
            </turbo-frame>
          </div>
        </body>
      </html>
    HTML
  end

  let(:inner_app) { lambda { |_env| [200, {"content-type" => "text/html"}, [html_body]] } }
  let(:app) { Agentation::Middleware.new(inner_app) }

  before { Agentation.configuration.enabled = true }

  it "injects a complete IIFE script" do
    _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
    response = body.first

    expect(response).to include("(function()")
    expect(response).to include("Module: toolbar")
    expect(response).to include("Module: identifier")
    expect(response).to include("Module: freeze")
    expect(response).to include("</script>\n</body>")
  end

  it "passes configuration via data attributes" do
    Agentation.configuration.default_detail = :detailed

    _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
    response = body.first

    expect(response).to include('data-agentation-detail="detailed"')
  end
end
```

**Step 2: Run all specs**

Run: `cd ~/Code/agentation-rails && bundle exec rspec`
Expected: All pass

**Step 3: Commit**

```bash
git add -A
git commit -m "Add integration specs"
```

---

## Task 15: Manual Testing in a Rails App

**Step 1: Add gem to the reef worktree Gemfile**

```ruby
# In the agentation-rails-poc worktree Gemfile
gem "agentation-rails", path: "~/Code/agentation-rails", group: :development
```

**Step 2: Bundle install and restart server**

```bash
cd /Users/jschuss/Brightline/reef/.worktrees/agentation-rails-poc
bundle install
script/worktree switch agentation-rails-poc
```

**Step 3: Verify in browser**

- Visit any page
- Toolbar should appear in bottom-right corner
- Click to activate, click an element, comment popup should appear
- Copy should produce structured markdown
- Verify Rails context (Stimulus controllers, Turbo frames, ViewComponent paths)

**Step 4: Remove the old in-app agentation code**

Delete the ViewComponent, Stimulus controller, CSS, and layout modifications from the worktree since they're replaced by the gem.

**Step 5: Commit**

```bash
git add -A
git commit -m "Replace in-app agentation with gem dependency"
```

---

## Implementation Order & Dependencies

```
Task 1 (Scaffold)
  ↓
Task 2 (Styles) ─────────────────────────────────────┐
Task 3 (Identifier) ──────────────────────────────────┤
Task 4 (Storage) ──────────────────────────────────────┤
Task 5 (Freeze) ───────────────────────────────────────┤
  ↓                                                    │
Task 6 (Overlay) ← depends on Styles                   │
Task 7 (Markers) ← depends on Styles, Storage          │
Task 8 (Popup) ← depends on Styles, Freeze             │
Task 9 (Output) ← depends on Identifier                │
  ↓                                                    │
Task 10 (Annotator) ← depends on Identifier, Overlay   │
Task 11 (Settings) ← depends on Storage, Styles        │
  ↓                                                    │
Task 12 (Toolbar) ← depends on ALL above               │
  ↓                                                    ↓
Task 13 (IIFE Bundle) ← depends on ALL modules
  ↓
Task 14 (Integration Tests)
  ↓
Task 15 (Manual Testing in Rails app)
```

Tasks 2-5 can be implemented in parallel.
Tasks 6-9 can be partially parallelized.
Tasks 10-11 can be partially parallelized.
Tasks 12-15 are sequential.
