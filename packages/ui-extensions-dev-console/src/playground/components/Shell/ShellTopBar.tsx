import React from 'react';
import {ActionList, TopBar} from '@shopify/polaris';
import {
  useExtensibilityHost,
  useSignal,
  useSignalEffect,
} from '@shopify/extensibility-host-react';
import type {Signal} from '@preact/signals-core';

import {AppIcon} from '../AppIcon';

interface ShellTopBarProps {
  navActive: Signal<boolean>;
  search: Signal<string>;
}

export function ShellTopBar({navActive, search}: ShellTopBarProps) {
  const extensibility = useExtensibilityHost();
  const searchActive = useSignal(false);
  const searchResults = useSignal<Extensibility.App[]>([]);

  function searchChanged(value: string) {
    search.value = value;
  }

  function dismiss() {
    searchActive.value = false;
    search.value = '';
    searchResults.value = [];
  }

  useSignalEffect(() => {
    const query = search.value;
    if (query) searchActive.value = true;
    searchResults.value = filterApps(extensibility.apps, query);
  });

  return (
    <TopBar
      showNavigationToggle
      onNavigationToggle={() => (navActive.value = !navActive.value)}
      userMenu={<UserMenu />}
      searchField={
        <TopBar.SearchField
          value={search.value}
          onChange={searchChanged}
          onFocus={() => (searchActive.value = true)}
          placeholder="Search"
        />
      }
      searchResults={
        <ActionList
          items={searchResults.value.map((app) => ({
            content: app.name,
            onAction() {
              extensibility.invoke(`app://${app.handle}`);
              dismiss();
            },
            prefix: <AppIcon icon={app.manifest.icon} />,
          }))}
          sections={[
            {
              title: '',
              items: [
                {content: 'Shopify help center'},
                {content: 'Community forums'},
              ],
            },
          ]}
        />
      }
      searchResultsOverlayVisible
      searchResultsVisible={searchActive.value}
      onSearchResultsDismiss={dismiss}
    />
  );
}

function UserMenu() {
  const active = useSignal(false);

  return (
    <TopBar.UserMenu
      actions={[
        {
          items: [{content: 'Community forums'}],
        },
      ]}
      name="Jason Miller"
      detail="My Store"
      initials="JM"
      open={active.value}
      onToggle={() => (active.value = !active.value)}
    />
  );
}

function filterApps(apps: Extensibility.App[], query: string) {
  if (query === 'Apps') {
    return apps.filter((app) => !getModality(app));
  }
  if (query === 'Sales Channels') {
    return apps.filter((app) => getModality(app) === 'channel');
  }
  const matches = createSearchMatcher(query);
  return apps.filter((app) => matches(app.name) || matches(app.handle));
}

function createSearchMatcher(query: string) {
  const decompose = (words: string) => words.toLowerCase().split(/[^a-z0-9]+/i);
  const terms = decompose(query).filter(Boolean);
  const hasTerms = (haystack: string) =>
    terms.some((str) => haystack.includes(str));
  return (str: string) => decompose(str).some(hasTerms);
}

function getModality(app: Extensibility.App) {
  return 'modality' in app.manifest ? app.manifest.modality : '';
}
