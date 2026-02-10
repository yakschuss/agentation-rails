module Agentation
  class ScriptBuilder
    MODULES = %w[
      styles storage freeze identifier overlay
      markers popup output annotator settings toolbar
    ].freeze

    def self.build
      @cached_script ||= compile
      detail = Agentation.configuration.default_detail
      color = Agentation.configuration.color
      %(<script data-agentation="true" data-agentation-detail="#{detail}" data-agentation-color="#{color}">#{@cached_script}</script>)
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
            document.addEventListener("DOMContentLoaded", function() { AgentationToolbar.init(config); });
          } else {
            AgentationToolbar.init(config);
          }
        })();
      JS
    end

    def self.clear_cache!
      @cached_script = nil
    end
  end
end
