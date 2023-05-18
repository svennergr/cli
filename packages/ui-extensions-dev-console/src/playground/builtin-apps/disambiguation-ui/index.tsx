import React from 'react';
import {useEffect, useState} from 'react';
import {
  AutoSelection,
  Box,
  Icon,
  Link,
  Listbox,
  Modal,
  Stack,
  Text,
} from '@shopify/polaris';

import {AppIcon} from '../../components/AppIcon';

const STORE_SEARCH = 'https://apps.shopify.com/search?q=';

interface DisambiguationProps {
  data: {
    type: string;
    list: _nextInstanceId.Launchable[];
    onChoose(launchable?: _nextInstanceId.Launchable): void;
  };
}

export default function DisambiguationUi({
  data: {type, list, onChoose},
}: DisambiguationProps) {
  const [selected, setSelected] = useState<number>(-1);

  // open after rendering (avoids janky animation in Polaris)
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(true), []);

  const close = () => onChoose();
  const choose = () => onChoose(list[selected]);
  const select = (value: string) => setSelected(Number(value));

  const storeLink = `${STORE_SEARCH}${encodeURIComponent(type)}`;

  return (
    <Modal
      title="Choose an app:"
      small
      open={open}
      onClose={close}
      primaryAction={{
        disabled: selected === -1,
        content: 'Open',
        onAction: choose,
      }}
    >
      <Box paddingBlockStart="2" paddingBlockEnd="2">
        {list.length === 0 ? (
          <Stack vertical alignment="center">
            <Box paddingBlockStart="6" paddingBlockEnd="6">
              <Text variant="bodyMd" color="subdued" as="p">
                None of your installed apps can handle this action.
              </Text>
            </Box>
          </Stack>
        ) : (
          <Listbox
            enableKeyboardControl
            autoSelection={AutoSelection.None}
            onSelect={select}
          >
            {list.map((launchable, index) => {
              if (!('app' in launchable.extensionPoint.extension)) return null;
              const app = launchable.extensionPoint.extension.app;
              const {manifest} = launchable.extensionPoint;
              const label =
                'label' in manifest ? String(manifest.label) : app.name;
              return (
                <Listbox.Action
                  value={`${index}`}
                  key={launchable.extensionPoint.id}
                >
                  <Box padding="1">
                    <Stack>
                      <Icon
                        source={() => <AppIcon icon={app.manifest.icon} />}
                      />
                      <div>{label}</div>
                    </Stack>
                  </Box>
                </Listbox.Action>
              );
            })}
          </Listbox>
        )}
      </Box>
      <Box
        paddingBlockStart="3"
        paddingBlockEnd="3"
        background="background"
        borderBlockStart="divider"
      >
        <Stack vertical alignment="center">
          <Link url={storeLink} monochrome removeUnderline>
            Find {list.length ? 'more' : ''} <strong>{type}</strong> apps in the
            App Store →
          </Link>
        </Stack>
      </Box>
    </Modal>
  );
}
