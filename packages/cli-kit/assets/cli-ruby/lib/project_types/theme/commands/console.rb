# frozen_string_literal: true

require "shopify_cli/theme/repl"

module Theme
  class Command
    class Console < ShopifyCLI::Command::SubCommand
      options do |parser, flags|
        parser.on("--page=PAGE_PATH") { |page| flags[:page] = page }
        parser.on("--port=PORT") { |port| flags[:port] = port }
      end

      def call(_args, _name)
        page = options.flags[:page]
        port = options.flags[:port]

        ShopifyCLI::Theme::Repl.new(@ctx, page, port).run
      end
    end
  end
end
