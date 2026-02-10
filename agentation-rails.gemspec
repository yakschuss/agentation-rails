require_relative "lib/agentation/version"

Gem::Specification.new do |spec|
  spec.name          = "agentation-rails"
  spec.version       = Agentation::VERSION
  spec.authors       = ["Josh Schuss"]
  spec.summary       = "Visual feedback tool for AI coding agents"
  spec.description   = "Rack middleware that injects a visual annotation toolbar for capturing element selectors, styles, and context to share with AI agents."
  spec.homepage      = "https://github.com/jschuss/agentation-rails"
  spec.license       = "PolyForm-Shield-1.0.0"
  spec.required_ruby_version = ">= 3.1"

  spec.files = Dir["lib/**/*", "app/**/*", "LICENSE"]
  spec.require_paths = ["lib"]

  spec.add_dependency "rack", ">= 2.0"
  spec.add_development_dependency "rspec", "~> 3.0"
  spec.add_development_dependency "rack-test", "~> 2.0"
  spec.add_development_dependency "rake", "~> 13.0"
end
