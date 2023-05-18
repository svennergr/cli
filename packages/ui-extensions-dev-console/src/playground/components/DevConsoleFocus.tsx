import React from 'react';
import {useComputed} from '@shopify/extensibility-host-react';

export function DevConsoleFocus({
  instance,
  children,
}: {
  instance: Extensibility.Instance;
  children: React.ReactNode;
}) {
  const isFocused = useComputed(
    () => instance.pluginApi['dev-console']?.focused,
  );

  return (
    <div
      style={{
        display: 'block',
        margin: '1rem 0',
        borderRadius: '.25rem',
        outline:
          isFocused.value === true
            ? '4px solid var(--p-focused, "red")'
            : undefined,
      }}
    >
      {children}
    </div>
  );
}
