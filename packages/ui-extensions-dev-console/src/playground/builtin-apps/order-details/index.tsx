import React from 'react';
import {
  Page,
  Stack,
  Card,
  PageProps,
  Badge,
  Button,
  Layout,
  Text,
  Thumbnail,
} from '@shopify/polaris';
import {useMemo} from 'react';
import {useExtensionPoints} from '@shopify/extensibility-host-react';
import {useLocation} from 'react-router';

import {getCusomterById} from '../orders/customer-data';

import AppsButton, {AppsButtonProps} from './AppsButton';

export default function OrderDetails() {
  const {pathname} = useLocation();
  const id = pathname.replace('/order/', '');

  const customer = getCusomterById(id);
  const links = useExtensionPoints('Admin::OrderDetails::Link');
  const actions = useExtensionPoints('Admin::OrderDetails::Action');
  const extensions = useMemo(() => {
    return {links, actions};
  }, [links, actions]);

  const appButtonProps: AppsButtonProps = {
    extensions,
    resource: {
      id,
      type: 'Order',
    },
  };

  const makePageProps: (id: string, badges?: string[]) => PageProps = (
    id,
    badges,
  ) => {
    const pageProps: PageProps = {
      breadcrumbs: [{content: 'Orders', url: '/orders'}],
      title: `Order ${id}`,
      subtitle: 'Last updated 3 days ago',
      compactTitle: true,
      titleMetadata: badges?.map((badge) => (
        <Badge key={badge + Math.random() * 10000} status="info">
          {badge}
        </Badge>
      )),
      secondaryActions: (
        <>
          <Stack>
            <Button outline>Edit</Button>
            <AppsButton {...appButtonProps} />
            <Button outline>...</Button>
          </Stack>
        </>
      ),
      actionGroups: [
        {
          title: '...',
          actions: [
            {
              content: 'Delete Order',
              accessibilityLabel: 'This never happened...',
              onAction: () => console.log(`delete with ${id}`),
            },
            {
              content: 'Refund Order',
              accessibilityLabel: 'Send dat cash back',
              onAction: () => console.log(`refund with ${id}`),
            },
          ],
        },
      ],
    };
    return pageProps;
  };

  const pageProps: PageProps = makePageProps(customer?.id || '', ['Fulfilled']);

  return (
    <Page {...pageProps}>
      <Layout>
        <Layout.Section>
          <Card title="Order details" sectioned>
            <Stack>
              <Thumbnail
                source="https://www.artik.com/toronto-blog/wp-content/uploads/2018/02/Screen-Shot-2018-02-09-at-9.26.53-AM-1024x874.png"
                alt="Image of Coffee mug"
              />
              <Stack vertical>
                <Text as="p" variant="bodyLg">
                  Coffee Mug (11oz)
                </Text>
                <Text as="p" variant="bodyMd" color="subdued">
                  SKU: 683642226
                </Text>
              </Stack>
            </Stack>
          </Card>
        </Layout.Section>
        <Layout.Section secondary>
          <Card title="Customer">
            <Card.Section>
              <Text as="p" variant="bodyMd">
                {customer?.name}
              </Text>
            </Card.Section>
            <Card.Section>
              <Stack vertical>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  Contact Info
                </Text>
                <Text as="p" variant="bodyMd">
                  {customer?.contact}
                </Text>
              </Stack>
            </Card.Section>
            <Card.Section>
              <Stack vertical>
                <Text as="p" variant="bodyMd" fontWeight="bold">
                  Shipping Address
                </Text>
                <Text as="p" variant="bodyMd">
                  {customer?.location}
                </Text>
              </Stack>
            </Card.Section>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
