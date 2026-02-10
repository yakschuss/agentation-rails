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
