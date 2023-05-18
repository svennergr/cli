import React from 'react';
import {useParams} from 'react-router';
import {DataTable} from '@shopify/polaris';

import orders from './orders-data';

export default function OrdersByProduct() {
  const params = useParams();
  const productId = params['*'] || '';

  const rows = orders
    .filter((order) => {
      return order.productIds.includes(productId);
    })
    .map((order) => {
      return [order.id, order.productIds.join(', '), order.total];
    });

  return (
    <DataTable
      columnContentTypes={['text', 'text', 'text']}
      headings={['Order ID', 'Product IDs', 'Total']}
      rows={rows}
    />
  );
}
