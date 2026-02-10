require "spec_helper"

RSpec.describe Agentation::Middleware do
  html_body = "<html><body><h1>Hello</h1></body></html>"
  inner_app = lambda { |_env| [200, {"content-type" => "text/html"}, [html_body]] }

  describe "#call" do
    it "injects script tag before </body>" do
      Agentation.configuration.enabled = true
      app = described_class.new(inner_app)

      status, _headers, body = app.call(Rack::MockRequest.env_for("/"))
      response_body = body.first

      expect(status).to eq(200)
      expect(response_body).to include('data-agentation="true"')
      expect(response_body).to include('data-agentation-detail="standard"')
      expect(response_body).to include("</script>\n</body>")
    end

    it "removes content-length header" do
      Agentation.configuration.enabled = true
      app = described_class.new(inner_app)

      _status, headers, _body = app.call(Rack::MockRequest.env_for("/"))

      expect(headers).not_to have_key("content-length")
    end

    it "skips non-HTML responses" do
      Agentation.configuration.enabled = true
      json_app = lambda { |_env| [200, {"content-type" => "application/json"}, ['{"ok":true}']] }
      middleware = described_class.new(json_app)

      _status, _headers, body = middleware.call(Rack::MockRequest.env_for("/"))

      expect(body.first).to eq('{"ok":true}')
    end

    it "skips when disabled" do
      Agentation.configuration.enabled = false
      app = described_class.new(inner_app)

      _status, _headers, body = app.call(Rack::MockRequest.env_for("/"))

      expect(body.first).not_to include("data-agentation")
    end

    it "skips non-200 responses" do
      Agentation.configuration.enabled = true
      error_app = lambda { |_env| [404, {"content-type" => "text/html"}, ["<html><body>Not Found</body></html>"]] }
      middleware = described_class.new(error_app)

      _status, _headers, body = middleware.call(Rack::MockRequest.env_for("/"))

      expect(body.first).not_to include("data-agentation")
    end
  end
end
