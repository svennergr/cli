import React from 'react';
import {createElement as h} from 'react';
import {createRoot} from '@remote-ui/react';

// export function render(
//   renderCallback: (api: any) => React.ReactElement,
// ): (root: any, api: any) => void {
//   return (root, api) => {
//     const element = renderCallback(api);
//     remoteRender(element, root, () => {
//       root.mount();
//     });
//   };
// }

shopify.extend('Admin::Apps::Home', (remoteRoot: any, api: any) => {
  createRoot(remoteRoot).render(<App api={api} />);
});

function App({api}: {api: any}) {
  return h(
    'page',
    {
      fullWidth: true,
      subtitle: 'Here’s what’s happening with your store today.',
    },
    h(
      'card',
      {subdued: true},
      h(
        'block-stack',
        {},
        h(
          'text',
          {variant: 'headingSm', as: 'h2', color: 'subdued'},
          'No store activity',
        ),
        h(
          'text',
          {variant: 'bodyMd', as: 'span', color: 'subdued'},
          'Your sales, orders, and sessions will show here.',
        ),
        h('button', {
          onPress: () => api.toast.show('Hello!'),
          title: 'Show toast',
        }),
      ),
    ),
  );
}
