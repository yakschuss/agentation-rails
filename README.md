# agentation-rails

Visual annotation toolbar for AI coding agents. Click, drag, or select elements on any page to capture selectors, classes, and context — then copy as structured markdown to paste into your AI conversation.

Zero config. Injects via Rack middleware in development. No layout changes, no asset pipeline, no feature flags.

## Install

Add to your Gemfile:

```ruby
group :development do
  gem "agentation-rails", github: "yakschuss/agentation-rails"
end
```

Run `bundle install`. Restart your server. That's it.

## What It Does

A small toggle button appears in the bottom-right corner of every page. Click it to activate annotation mode:

**Click** any element to capture it. A popup appears where you can add a comment and categorize your intent (Fix, Change, Question, OK).

**Shift+drag** to draw a rectangle and multi-select elements.

**Alt+drag** to select an area (even empty space).

**Select text** and click the "Annotate" bubble that appears.

Hit **Copy** to get structured markdown like this:

```markdown
# UI Annotations

_3 annotations captured at /users/settings_

## 1. button "Save Changes"
change: Make this more prominent, maybe full-width
- **Selector:** `form > div.actions > button.btn-primary`
- **Classes:** btn, btn-primary, px-4, py-2
- **Stimulus:** form-validation
- **Partial:** `app/views/users/_form.html.erb`

## 2. nav.sidebar
fix: Active state not highlighting correctly
- **Selector:** `nav.sidebar`
- **Classes:** sidebar, fixed, w-64
- **Component:** `app/components/navigation/sidebar_component.html.erb`
```

Paste that into Claude, Cursor, Copilot, or whatever you're working with.

## Features

### Annotation Modes
- **Click** — single element capture
- **Text selection** — annotate highlighted text
- **Shift+drag** — multi-select elements in a rectangle
- **Alt+drag** — area selection (captures region even if empty)

### Rails Context Detection
Automatically detects and includes:
- **Stimulus controllers** — `data-controller` attributes on the element and ancestors
- **Turbo Frames** — nearest `turbo-frame` ID
- **ViewComponent paths** — extracted from `<!-- BEGIN ... -->` HTML comments
- **Partial paths** — extracted from Rails view annotations

### Intent Categories
Tag each annotation with an intent:
- **Fix** — something is broken
- **Change** — request a modification
- **?** — asking a question
- **OK** — approve / looks good

### 4 Detail Levels
Configure how much context to capture (via settings panel):

| Level | Includes |
|-------|----------|
| **Compact** | Element name, comment |
| **Standard** | + selector, classes, path, nearby text, Rails context |
| **Detailed** | + computed styles, accessibility attributes |
| **Forensic** | + full DOM path, all data attributes |

### Other Features
- **Freeze mode** — pauses all CSS animations, JS timers, and WAAPI animations so you can annotate animated elements
- **Numbered markers** — dots on the page showing where each annotation was captured
- **Dark/light mode** — toggle theme for the toolbar
- **Persistent storage** — annotations survive page reloads (localStorage, 7-day TTL)
- **Settings panel** — configure detail level, accent color, marker behavior, and more
- **Keyboard shortcuts** — Enter to submit, Escape to cancel, Shift+Enter for newline

## Configuration

Zero config works for most cases. To customize:

```ruby
# config/initializers/agentation.rb
Agentation.configure do |config|
  config.enabled = Rails.env.development?  # default: auto-detects development
  config.default_detail = :standard        # :compact, :standard, :detailed, :forensic
  config.color = "#3c82f7"                 # accent color (hex)
end
```

## How It Works

1. `Agentation::Railtie` registers `Agentation::Middleware` in the Rails middleware stack
2. The middleware intercepts HTML responses and injects a `<script>` tag before `</body>`
3. The script is a self-contained IIFE (~3,700 lines) with zero external dependencies
4. All CSS is injected via a `<style>` tag from JavaScript — no stylesheet to load
5. UI elements are scoped under `[data-agentation-toolbar]` to prevent style leakage

## Development

```bash
git clone https://github.com/yakschuss/agentation-rails.git
cd agentation-rails
bundle install
bundle exec rspec
```

The JavaScript modules live in `app/assets/javascripts/agentation/`:

| Module | Purpose |
|--------|---------|
| `styles.js` | All CSS via CSS-in-JS, dark/light theming |
| `identifier.js` | Element identification + Rails context detection |
| `storage.js` | localStorage persistence with TTL |
| `freeze.js` | Animation/timer freeze via monkey-patching |
| `overlay.js` | Hover highlight, selection rectangles, capture flash |
| `markers.js` | Numbered annotation dots |
| `popup.js` | Comment form with intent pills |
| `output.js` | Markdown generation at 4 detail levels |
| `annotator.js` | 4 selection modes (click, text, shift+drag, alt+drag) |
| `settings.js` | Settings panel UI |
| `toolbar.js` | Main orchestrator |

## Credits

This is a Rails/Rack port of [agentation](https://github.com/benjitaylor/agentation) by [Benji Taylor](https://github.com/benjitaylor). The original is a React component with an MCP server for real-time agent communication. This gem reimplements the annotation UI as framework-agnostic vanilla JS injected via Rack middleware, and adds Rails-specific context detection (Stimulus, Turbo, ViewComponent, partials).

## License

[PolyForm Shield License 1.0.0](https://polyformproject.org/licenses/shield/1.0.0) — same as the original agentation project. You can use, modify, and distribute freely, but you may not use it to build a competing product.
