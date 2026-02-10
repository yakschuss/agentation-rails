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
