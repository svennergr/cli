import React from 'react';
import {
  useComputed,
  useExtensibilityHost,
  useSignal,
} from '@shopify/extensibility-host-react';
import {Toast} from '@shopify/polaris';

export function ToastPlugin() {
  const host = useExtensibilityHost();

  const list = useSignal(host.pluginApi.toasts?.list);

  return (
    <>
      {list.value.map(
        (toast: {key: string; content: string; onDismiss: () => void}) => (
          <Toast {...toast} />
        ),
      )}
    </>
  );
}
