import React from 'react';
import {Card, Icon, Page, Stack, Text} from '@shopify/polaris';
import {StoreStatusMajor} from '@shopify/polaris-icons';

export default function Home() {
  return (
    <Page fullWidth subtitle="Here’s what’s happening with your store today.">
      <Card subdued>
        <Card.Section>
          <Stack alignment="center">
            <Icon source={StoreStatusMajor} color="subdued" />
            <Stack vertical spacing="extraTight">
              <Text variant="headingSm" as="h2" color="subdued">
                No store activity
              </Text>
              <Text variant="bodyMd" as="span" color="subdued">
                Your sales, orders, and sessions will show here.
              </Text>
            </Stack>
          </Stack>
        </Card.Section>
      </Card>
    </Page>
  );
}
