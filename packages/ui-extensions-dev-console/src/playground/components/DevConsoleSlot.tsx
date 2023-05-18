import React from 'react';
import {
  useExtensibilityHost,
  useExtensionPoints,
} from '@shopify/extensibility-host-react';
import {useEffect} from 'react';
import type {App, ExtensionPayload} from '@shopify/ui-extensions-server-kit';
import {DevConsoleSearchQuery} from '@shopify/dev-console-plugin';

const DEV_CONSOLE_STORAGE_KEY = 'extensions-dev-v4';

function getResourceUrl(ext: ExtensionPayload) {
  switch (ext.type) {
    case 'product_subscription':
      return 'app://products';
    default:
      return '';
  }
}

export function DevConsoleSlot() {
  const [devConsole] = useExtensionPoints(DevConsoleSearchQuery);
  const host = useExtensibilityHost();
  const {client, connect} = host.pluginApi['dev-console'];

  useEffect(() => {
    const unsubscribeConnected = client.on(
      'connected',
      (payload: {app: App; extensions: ExtensionPayload[]}) => {
        const updatedExtensions: ExtensionPayload[] = payload.extensions.map(
          (ext) => ({
            ...ext,
            development: {
              ...ext.development,
              resource: {url: getResourceUrl(ext)},
            },
          }),
        );
        client.persist('update', {extensions: updatedExtensions});
      },
    );

    const unsubscribeNavigate = client.on(
      'navigate',
      ({url}: {url: string}) => {
        host.invoke(url);
      },
    );

    return () => {
      unsubscribeConnected();
      unsubscribeNavigate();
    };
  }, [host, client]);

  useEffect(() => {
    const devConsoleOptions = JSON.parse(
      localStorage.getItem(DEV_CONSOLE_STORAGE_KEY) ?? 'null',
    );

    if (devConsoleOptions) {
      connect({
        ...devConsoleOptions,
        surface: 'admin',
      });
    }
  }, [connect, client]);

  return devConsole?.activeInstance ? (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        height: '250px',
        width: '100%',
        zIndex: 1234567,
      }}
    >
      {devConsole.activeInstance?.runtime.outlet}
    </div>
  ) : null;
}
