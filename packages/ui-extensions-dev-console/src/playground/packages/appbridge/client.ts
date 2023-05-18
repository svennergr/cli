import {appBridgeClient} from '@shopify/extensibility-host-runtimes';

// import navigation from './navigation';
import {createFetch} from './fetch';

declare global {
  interface Window {
    shopify: any;
  }
}

const app = appBridgeClient.createApp();
window.shopify = app.api;

// navigation(app);
globalThis.fetch = createFetch(app);
