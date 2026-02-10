module Agentation
  class Railtie < Rails::Railtie
    initializer "agentation.configure_middleware" do |app|
      require "agentation/middleware"
      app.middleware.use Agentation::Middleware
    end
  end
end
