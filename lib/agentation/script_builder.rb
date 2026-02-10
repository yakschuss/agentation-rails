module Agentation
  class ScriptBuilder
    def self.build
      script = File.read(File.expand_path("../../app/assets/javascripts/agentation/agentation.js", __dir__))
      %(<script data-agentation="true">#{script}</script>)
    end
  end
end
