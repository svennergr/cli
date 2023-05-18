import React from 'react';
import {
  Button,
  EmptyState,
  Icon,
  IndexTable,
  Scrollable,
  Stack,
  Tabs,
} from '@shopify/polaris';
import {CodeMinor, CancelMajor} from '@shopify/polaris-icons';
import {
  useInstances,
  useSignal,
  useSignalEffect,
} from '@shopify/extensibility-host-react';

import {AppIcon} from './AppIcon';

const INITIAL_ENABLED =
  typeof sessionStorage !== 'undefined' &&
  Boolean(sessionStorage.getItem('devMode'));

export function DevMode() {
  const enabled = useSignal(INITIAL_ENABLED);

  function toggle() {
    enabled.value = !enabled.value;
  }

  useSignalEffect(() => {
    if (enabled.value) sessionStorage.setItem('devMode', '1');
    else sessionStorage.removeItem('devMode');
  });

  return (
    <>
      <button
        className="devModeToggle"
        title="Dev Mode"
        onClick={toggle}
        hidden={enabled.value}
      >
        <Icon source={CodeMinor} />
      </button>
      {enabled.value && <DevUi close={toggle} />}
    </>
  );
}

function DevUi({close}: {close(): void}) {
  const tab = useSignal(0);
  const panel = panels[tab.value];

  return (
    <div className="devMode">
      <Stack distribution="trailing" wrap={false} alignment="center">
        <Stack.Item fill>
          <Tabs
            tabs={panels.map((panel) => ({
              content: panel.name,
              id: panel.id,
            }))}
            selected={tab.value}
            onSelect={(index) => (tab.value = index)}
          ></Tabs>
        </Stack.Item>
        <Button plain size="large" icon={CancelMajor} onClick={close} />
      </Stack>
      <panel.content />
    </div>
  );
}

const panels = [
  {name: '🏠', id: 'home', content: DevUiHome},
  {name: 'Processes', id: 'processes', content: ProcessManager},
];

function DevUiHome() {
  return (
    <EmptyState
      image={
        'data:image/svg+xml,<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="48" height="48"><path d="m3.5 8.5 3-7h7l-5 5h4l-8 9.1 2-7.1z" style="stroke-linejoin:round;stroke:%23ffbf00;stroke-width:.25;fill:%23ffd500"/></svg>'
      }
      heading="Dev Mode"
    >
      This admin has super cow powers.
    </EmptyState>
  );
}

function ProcessManager() {
  const running = useInstances('*');

  return (
    <Scrollable>
      <IndexTable
        headings={[
          {title: 'ID', flush: true},
          {title: 'Name'},
          {title: 'State', flush: true},
          {title: 'Runtime', flush: true},
        ]}
        itemCount={running.length}
        // selectable={false}
      >
        {running.map((instance, i) => {
          function focus() {
            instance.activate();
          }
          return (
            <IndexTable.Row
              selected={instance.status === 'active'}
              key={instance.id}
              id={`${instance.id}`}
              position={i}
              onClick={focus}
            >
              <IndexTable.Cell flush>{instance.id}</IndexTable.Cell>
              <IndexTable.Cell>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '.5em',
                  }}
                >
                  <AppIcon
                    icon={instance.extensionPoint.extension.app.manifest.icon}
                    width="1.2em"
                    height="1.2em"
                    style={{
                      opacity: instance.status === 'active' ? 1 : 0.5,
                    }}
                  />
                  {instance.extensionPoint.extension.app.name}
                </span>
              </IndexTable.Cell>
              <IndexTable.Cell flush>{instance.status}</IndexTable.Cell>
              <IndexTable.Cell flush>
                {instance.extensionPoint.type}
              </IndexTable.Cell>
            </IndexTable.Row>
          );
        })}
      </IndexTable>
    </Scrollable>
  );
}
