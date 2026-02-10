require "rack/test"
require "agentation"
require "agentation/middleware"

RSpec.configure do |config|
  config.include Rack::Test::Methods
end
