import {createElement, Fragment} from 'react';
import {Toast, type ToastProps} from '@shopify/polaris';
import {signal} from '@preact/signals-core';

export default function toastsPlugin(): Extensibility.Plugin {
  let nextKey = 0;
  const toasts = signal<(ToastProps & {key: number})[]>([]);
  return {
    name: 'toasts',
    expose() {
      return {
        list: toasts,
      };
    },
    instanceCreated(instance) {
      // Inject a Polaris-powered Toasts API into extensions:
      instance.api.expose({
        toast: {
          show(message: string) {
            const toast = {
              key: ++nextKey,
              content: message,
              onDismiss() {
                toasts.value = toasts.value.filter((t) => t !== toast);
              },
            };
            toasts.value = toasts.value.concat(toast);
          },
        },
      });
    },
  };
}
