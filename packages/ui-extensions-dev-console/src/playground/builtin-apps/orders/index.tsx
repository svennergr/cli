import React from 'react';
import {
  TextField,
  IndexTable,
  Page,
  Filters,
  Select,
  useIndexResourceState,
  Text,
  Tag,
  Stack,
} from '@shopify/polaris';
import {useEffect} from 'react';
import {
  useExtensibilityHost,
  useSignal,
} from '@shopify/extensibility-host-react';
import {useNavigate} from 'react-router';

import {AppIcon} from '../../components/AppIcon';

import customers from './customer-data';

export default function Orders() {
  const host = useExtensibilityHost();
  const navigate = useNavigate();

  const resourceName = {
    singular: 'customer',
    plural: 'customers',
  };

  const {selectedResources, allResourcesSelected, handleSelectionChange} =
    useIndexResourceState(customers);
  const taggedWith = useSignal('VIP');
  const query = useSignal('');
  const sort = useSignal('today');

  function clearAll() {
    taggedWith.value = '';
    query.value = '';
    sort.value = '';
  }

  const promotedBulkActions = [
    {
      content: 'Edit orders',
      onAction: () => {
        const ids = selectedResources.join(',');
        host.invoke(`edit:orders?orders=${ids}`);
      },
    },
    {
      content: 'Print orders',
      onAction: () => {
        const ids = selectedResources.join(',');
        host.invoke(`print:orders?orders=${ids}`, {resolve: true});
      },
    },
  ];

  // get a list of extensions that have declared `action:order` intent filters:
  const actions = useSignal<Extensibility.Launchable[]>([]);
  useEffect(() => {
    host.resolveUrl('action:orders').then((launchables) => {
      actions.value = launchables;
    });

    // 1P: "I have an action and some data"
    // 3P (declared): "I can handle this type of action and data"
    // 3P (invoked): "I am being asked to handle this action and data"
    //   url --> intent --> resolved to launchables --> picker displayed --> launchable invoked --> instance created w/ runtime
    //                                                                       ^^^^ any extension type (except inline)
    // host.resolveUrl('action:orders');
    // host.resolveUrl('app:foo');
    // host.invoke('app:foo');
    // host.invoke('action:orders'): Promise;
    // host.invoke('judgeme:review?id=1'): Promise;
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
  // .concat({
  //   content: 'More actions...',
  //   icon: () => <IconsMajor />,
  //   onAction: () => {
  //     host.invoke(`action:orders?orders=${selectedResources.join(',')}`);
  //   },
  // });

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

  const filteredCustomers = customers.filter((customer) => {
    const q = munge(query.value);
    if (q && !munge(customer.name).includes(q)) return false;
    if (taggedWith.value && !(customer.tags || []).includes(taggedWith.value))
      return false;
    return true;
  });

  const rowMarkup = filteredCustomers.map(
    ({id, name, location, orders, amountSpent, tags}, index) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        onClick={() => navigate(`/order/${id}`)}
        position={index}
      >
        <IndexTable.Cell>
          <Text variant="bodyMd" fontWeight="bold" as="span">
            {name}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>{location}</IndexTable.Cell>
        <IndexTable.Cell>{orders}</IndexTable.Cell>
        <IndexTable.Cell>{amountSpent}</IndexTable.Cell>
        <IndexTable.Cell>
          <Stack spacing="extraTight">
            {tags &&
              tags.map((tag) => (
                <Tag key={tag} onClick={() => (taggedWith.value = tag)}>
                  {tag}
                </Tag>
              ))}
          </Stack>
        </IndexTable.Cell>
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
        itemCount={customers.length}
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
          {title: 'Location'},
          {title: 'Order count'},
          {title: 'Amount spent', hidden: false},
          {title: 'Tags'},
        ]}
      >
        {rowMarkup}
      </IndexTable>
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
