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
