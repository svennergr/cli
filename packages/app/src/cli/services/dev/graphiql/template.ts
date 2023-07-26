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
      #graphiql {
        height: 100vh;
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
    <div id="graphiql">Loading...</div>
    <script
      src="https://unpkg.com/graphiql@3.0.4/graphiql.min.js"
      type="application/javascript"
    ></script>
    <script>
      const macCommandKey = String.fromCodePoint(8984)
      ReactDOM.render(
        React.createElement(GraphiQL, {
          fetcher: GraphiQL.createFetcher({
            url: '{{url}}/graphiql/graphql.json',
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
          plugins: [
            {
              title: 'AI query generator',
              icon: function() {
                return React.createElement('img', {
                  'srcSet': 'https://cdn.shopify.com/shopifycloud/brochure/assets/brand-assets/shopify-logo-primary-logo-456baa801ee66a0a435671082365958316831c9960c480451dd0330bcdae304f.svg',
                })
              },
              content: function() {
                const [query, setQuery] = React.useState('')
                const [queryInProgress, setQueryInProgress] = React.useState(false)
                const [errors, setErrors] = React.useState(null)
                return React.createElement(
                  'div',
                  {},
                  React.createElement('div', {}, [
                    React.createElement('h2', {}, 'AI query generator'),
                    React.createElement('h3', {}, '! Experimental !'),
                    React.createElement('p', {}, 'This feature uses AI to create GraphQL queries and may be prone to error.'),
                    React.createElement('textarea', {
                      id: 'ai-query-generator',
                      placeholder: "Describe in your own words what you'd like to query...",
                      style: {
                        width: '100%',
                        height: '100px',
                        padding: '10px',
                        boxSizing: 'border-box',
                        marginBottom: '10px',
                      },
                    }),
                    React.createElement('br'),
                    React.createElement('button', {
                      disabled: queryInProgress,
                      onClick: function() {
                        setQueryInProgress(true)
                        const query = document.getElementById('ai-query-generator').value
                        fetch('{{url}}/graphiql/ai?queryInput=' + encodeURIComponent(query)).then(function(response) {
                          setQueryInProgress(false)
                          response.json().then(function(data) {
                            setQuery(data.query)
                            setErrors(data.errors)
                          })
                        })
                      },
                    }, 'Generate query'),
                    React.createElement('br'),
                    query ? React.createElement('div', {}, [
                      React.createElement('h3', {}, 'Generated query'),
                      React.createElement('p', {}, [
                        React.createElement('code', {}, [
                          React.createElement('pre', {}, query),
                        ]),
                      ]),
                      React.createElement('button', {
                        onClick: function() {
                          // Copy the query to the clipboard
                          const el = document.createElement('textarea')
                          el.value = query
                          document.body.appendChild(el)
                          el.select()
                          document.execCommand('copy')
                          document.body.removeChild(el)
                        },
                      }, 'copy'),
                    ]) : null,
                    errors ? React.createElement('div', {}, [
                      React.createElement('h3', {}, 'Errors'),
                      React.createElement(
                        'ul',
                        {},
                        errors.map(function(error) {
                          return React.createElement('li', {}, error.message)
                        }),
                      ),
                    ]) : null,
                  ]),
                )
              },
            },
          ]
        }),
        document.getElementById('graphiql'),
      );
    </script>
  </body>
</html>
`
