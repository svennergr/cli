import {platformAndArch} from '@shopify/cli-kit/node/os'

const controlKey = platformAndArch().platform === 'darwin' ? 'MAC_COMMAND_KEY' : 'Ctrl'

const graphiqlIntroMessage = `
# Welcome to the Shopify GraphiQL Explorer! If you've used GraphiQL before,
# you can go ahead and jump to the next tab.
#
# GraphiQL is an in-browser tool for writing, validating, and
# testing GraphQL queries.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# Keyboard shortcuts:
#
#   Prettify query:  Shift-${controlKey}-P (or press the prettify button)
#
#  Merge fragments:  Shift-${controlKey}-M (or press the merge button)
#
#        Run Query:  ${controlKey}-Enter (or press the play button)
#
#    Auto Complete:  ${controlKey}-Space (or just start typing)
#
`

export const defaultQuery = `{
  shop {
    name
    url
    myshopifyDomain
    plan {
      displayName
      partnerDevelopment
      shopifyPlus
    }
  }
}
`.replace(/\n/g, '\\n')

export const template = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>GraphiQL</title>
    <style>
      body {
        height: 100%;
        margin: 0;
        width: 100%;
        overflow: hidden;
      }
      .top-bar {
        padding: 4px 8px;
        border-bottom: 1px solid #d6d6d6;
      }
      .top-bar p {
        margin: 0;
      }
      #graphiql {
        height: 100vh;
        display: flex;
        flex-direction: column;
      }
      #graphiql-explorer {
        flex-grow: 1;
        overflow: auto;
      }
    </style>
    <script
      src="https://unpkg.com/react@17/umd/react.development.js"
      integrity="sha512-Vf2xGDzpqUOEIKO+X2rgTLWPY+65++WPwCHkX2nFMu9IcstumPsf/uKKRd5prX3wOu8Q0GBylRpsDB26R6ExOg=="
      crossorigin="anonymous"
    ></script>
    <script
      src="https://unpkg.com/react-dom@17/umd/react-dom.development.js"
      integrity="sha512-Wr9OKCTtq1anK0hq5bY3X/AvDI5EflDSAh0mE9gma+4hl+kXdTJPKZ3TwLMBcrgUeoY0s3dq9JjhCQc7vddtFg=="
      crossorigin="anonymous"
    ></script>
    <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
  </head>
  <body>
    <div id="graphiql">
      <div class="top-bar">
        <p>
          Running API version
          <select id="version-select">
            {% for version in versions %}
              <option value="{{ version }}" {% if version == apiVersion %}selected{% endif %}>{{ version }}</option>
            {% endfor %}
          </select>
          against <code>{{storeFqdn}}</code>
          as app <code>{{appName}}</code>
        </p>
      </div>
      <div id="graphiql-explorer">Loading...</div>
    </div>
    <script
      src="https://unpkg.com/graphiql@3.0.4/graphiql.min.js"
      type="application/javascript"
    ></script>
    <script>
      const macCommandKey = String.fromCodePoint(8984)
      const renderGraphiQL = function(apiVersion) {
        ReactDOM.render(
          React.createElement(GraphiQL, {
            fetcher: GraphiQL.createFetcher({
              url: '{{url}}/graphiql/graphql.json?api_version=' + apiVersion,
            }),
            defaultEditorToolsVisibility: true,
            defaultTabs: [
              {query: "${graphiqlIntroMessage
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n')}".replace(/MAC_COMMAND_KEY/g, macCommandKey)},
              {%for query in defaultQueries%}
                {query: "{%if query.preface %}{{query.preface}}\\n{% endif %}{{query.query}}", variables: "{{query.variables}}"},
              {%endfor%}
            ],
          }),
          document.getElementById('graphiql-explorer'),
        )
      }
      renderGraphiQL('{{apiVersion}}')

      // Update the version when the select changes
      document.getElementById('version-select').addEventListener('change', function(event) {
        renderGraphiQL(event.target.value)
      })
    </script>
  </body>
</html>
`
