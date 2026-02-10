require "spec_helper"

RSpec.describe "Full stack integration" do
  html_body = <<~HTML
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

  inner_app = lambda { |_env| [200, {"content-type" => "text/html"}, [html_body]] }

  before do
    Agentation.configuration.enabled = true
    Agentation::ScriptBuilder.clear_cache!
  end

  it "injects a complete IIFE script with all modules" do
    app = Agentation::Middleware.new(inner_app)
    _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
    response = body.first

    expect(response).to include("(function()")
    expect(response).to include("Module: toolbar")
    expect(response).to include("Module: identifier")
    expect(response).to include("Module: freeze")
    expect(response).to include("Module: styles")
    expect(response).to include("Module: storage")
    expect(response).to include("Module: overlay")
    expect(response).to include("Module: markers")
    expect(response).to include("Module: popup")
    expect(response).to include("Module: output")
    expect(response).to include("Module: annotator")
    expect(response).to include("Module: settings")
    expect(response).to include("</script>\n</body>")
  end

  it "passes configuration via data attributes" do
    Agentation.configuration.default_detail = :detailed
    Agentation::ScriptBuilder.clear_cache!
    app = Agentation::Middleware.new(inner_app)

    _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
    response = body.first

    expect(response).to include('data-agentation-detail="detailed"')
  end

  it "passes color configuration" do
    Agentation.configuration.color = "#ff0000"
    Agentation::ScriptBuilder.clear_cache!
    app = Agentation::Middleware.new(inner_app)

    _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
    response = body.first

    expect(response).to include('data-agentation-color="#ff0000"')
  end

  it "preserves the original HTML content" do
    app = Agentation::Middleware.new(inner_app)
    _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
    response = body.first

    expect(response).to include('<button data-testid="save-btn">Save</button>')
    expect(response).to include('<turbo-frame id="content">')
    expect(response).to include('data-controller="tabs"')
  end

  it "includes Rails context detection in the identifier module" do
    app = Agentation::Middleware.new(inner_app)
    _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
    response = body.first

    expect(response).to include("getStimulusControllers")
    expect(response).to include("getTurboFrameId")
    expect(response).to include("getViewComponentPath")
    expect(response).to include("getPartialPath")
  end

  it "includes the bootstrap code" do
    app = Agentation::Middleware.new(inner_app)
    _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
    response = body.first

    expect(response).to include("AgentationToolbar.init(config)")
    expect(response).to include("DOMContentLoaded")
  end
end
