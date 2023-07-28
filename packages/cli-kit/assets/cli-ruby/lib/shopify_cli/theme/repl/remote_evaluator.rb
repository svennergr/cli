# frozen_string_literal: true

module ShopifyCLI
  module Theme
    class Repl
      class RemoteEvaluator
        extend Forwardable

        attr_reader :snippet

        def_delegators :snippet, :ctx, :api, :session, :input

        def initialize(snippet)
          @snippet = snippet
        end

        def evaluate
          eval_result || eval_context || eval_assignment_context
        end

        private

        def eval_result
          json = <<~JSON
            { "type": "display", "value": {{ #{input} | json }} }
          JSON

          response = request(json)

          return nil unless success?(response)

          json = json_from_response(response)
          json.last["value"]
        end

        def eval_context(eval_input = input)
          json = <<~JSON
            { "type": "context", "value": "{% #{eval_input.gsub(/"/, "\\\"")} %}" }
          JSON

          response = request(json)
          session << JSON.parse(json) if success?(response)

          nil
        end

        def eval_assignment_context
          is_assignment = /^\s*((?-mix:\(?[\w\-\.\[\]]\)?)+)\s*=\s*(.*)\s*/m.match?(input)

          return unless is_assignment

          patched_input = "assign #{input}".tap { |i| ctx.puts("{{gray:> #{i}}}") }

          eval_context(patched_input)
        end

        def json_from_response(response)
          JSON.parse(
            response.body.lines[1..-2].join.strip,
          )
        end

        def request(json)
          request_body = <<~LIQUID
            [
              #{session.map(&:to_json).push(json).join(",").gsub('\"', '"')}
            ]
          LIQUID

          response = api.request(request_body)

          expired_session_error if expired_session?(response)
          too_many_requests_error if too_many_requests?(response)

          response
        end

        def success?(response)
          response.code == "200"
        end

        def expired_session?(response)
          response.code == "401" || response.code == "403"
        end

        def too_many_requests?(response)
          response.code == "430" || response.code == "429"
        end

        def expired_session_error
          ctx.puts("{{red:Session expired. Please initiate a new one.}}")
          raise ShopifyCLI::AbortSilent
        end

        def too_many_requests_error
          ctx.puts("{{red:Evaluations limit reached. Try again later.}}")
          raise ShopifyCLI::AbortSilent
        end
      end
    end
  end
end
