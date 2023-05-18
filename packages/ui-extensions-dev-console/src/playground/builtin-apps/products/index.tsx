import React from 'react';
/* eslint-disable @shopify/strict-component-boundaries */
import {
  TextField,
  IndexTable,
  Page,
  Filters,
  Select,
  useIndexResourceState,
  Text,
} from '@shopify/polaris';
import {useEffect} from 'react';
import {
  useExtensibilityHost,
  useSignal,
} from '@shopify/extensibility-host-react';
import {useNavigate} from 'react-router';

import {ProductSubscriptionSlot} from '../../components/ProductSubscriptionSlot';
import {AppIcon} from '../../components/AppIcon';

import products from './products-data';

export default function Products() {
  const host = useExtensibilityHost();
  const navigate = useNavigate();

  const resourceName = {
    singular: 'product',
    plural: 'products',
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(products);
  const taggedWith = useSignal('all');
  const query = useSignal('');
  const sort = useSignal('today');

  function clearAll() {
    taggedWith.value = '';
    query.value = '';
    sort.value = '';
  }

  const promotedBulkActions = [
    {
      content: 'Edit products',
      onAction: () => {
        const ids = selectedResources.join(',');
        host.invoke(`edit:products?products=${ids}`);
      },
    },
    {
      content: 'Print products',
      onAction: () => {
        const ids = selectedResources.join(',');
        host.invoke(`print:products?products=${ids}`, {resolve: true});
      },
    },
  ];

  // get a list of extensions that have declared `action:product` intent filters:
  const actions = useSignal<Extensibility.Launchable[]>([]);
  useEffect(() => {
    host.resolveUrl('action:products').then((launchables) => {
      actions.value = launchables;
    });
  }, []);

  // Generate the bulk actions menu/overlay:
  const bulkActions = actions.value.map((launchable) => {
    const ext = launchable.extensionPoint as Extensibility.ExtensionPoint;
    const desc = ext.manifest;
    return {
      content: desc.intents?.[0].label || desc.label || ext.extension.app.name,
      icon: () => (
        <AppIcon icon={ext.extension.app.manifest.icon} padding={false} />
      ),
      onAction: () => {
        // problem: `launchable.data` is empty here because resolveUrl() is called once with no querystring
        host.launch(launchable);
      },
    };
  });

  const filters = [
    {
      key: 'taggedWith',
      label: 'Tagged with',
      filter: (
        <TextField
          label="Tagged with"
          value={taggedWith.value}
          onChange={(value) => (taggedWith.value = value)}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
  ];

  const appliedFilters = taggedWith.value
    ? [
        {
          key: 'taggedWith',
          label: disambiguateLabel('taggedWith', taggedWith.value),
          onRemove: () => (taggedWith.value = ''),
        },
      ]
    : [];

  const sortOptions = [
    {label: 'Today', value: 'today'},
    {label: 'Yesterday', value: 'yesterday'},
    {label: 'Last 7 days', value: 'lastWeek'},
  ];

  const filteredProducts = products.filter((product) => {
    const q = munge(query.value);
    if (q && !munge(product.name).includes(q)) return false;
    if (taggedWith.value && !(product.tags || []).includes(taggedWith.value))
      return false;
    return true;
  });

  const rowMarkup = filteredProducts.map(
    ({id, name, status, inventory, type, vendor}, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        onClick={() => navigate(`/product/${id}`)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{status}</IndexTable.Cell>
        <IndexTable.Cell>{inventory}</IndexTable.Cell>
        <IndexTable.Cell>{type}</IndexTable.Cell>
        <IndexTable.Cell>{vendor}</IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  return (
    <Page>
      <div style={{padding: '16px', display: 'flex'}}>
        <div style={{flex: 1}}>
          <Filters
            queryValue={query.value}
            filters={filters}
            appliedFilters={appliedFilters}
            onQueryChange={(value) => (query.value = value)}
            onQueryClear={() => (query.value = '')}
            onClearAll={clearAll}
          />
        </div>
        <div style={{paddingLeft: '0.25rem'}}>
          <Select
            labelInline
            label="Sort by"
            options={sortOptions}
            value={sort.value}
            onChange={(value) => (sort.value = value)}
          />
        </div>
      </div>
      <IndexTable
        resourceName={resourceName}
        itemCount={products.length}
        selectedItemsCount={
          allResourcesSelected ? 'All' : selectedResources.length
        }
        onSelectionChange={handleSelectionChange}
        hasMoreItems
        bulkActions={bulkActions}
        promotedBulkActions={promotedBulkActions}
        lastColumnSticky
        headings={[
          {title: 'Name'},
          {title: 'Status'},
          {title: 'Inventory'},
          {title: 'Type'},
          {title: 'Vendor'},
        ]}
      >
        {rowMarkup}
      </IndexTable>
      <ProductSubscriptionSlot target="Admin::Product::SubscriptionPlan::Create" />
    </Page>
  );
}

function disambiguateLabel(key: string, value: string) {
  switch (key) {
    case 'taggedWith':
      return `Tagged with ${value}`;
    default:
      return value;
  }
}

function munge(str: string) {
  return str.toLowerCase().replace(/^[a-z]/g, '');
}
