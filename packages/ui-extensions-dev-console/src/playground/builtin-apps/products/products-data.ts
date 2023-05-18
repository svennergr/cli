const products = [
  {
    id: '1',
    url: 'products/1',
    name: 'Headphones',
    status: 'active',
    inventory: 10,
    type: 'music',
    vendor: 'Bose',
    tags: ['all', 'music', 'headphones', 'bose'],
  },
  {
    id: '2',
    url: 'products/2',
    name: 'Broom',
    status: 'active',
    inventory: 98,
    type: 'household',
    vendor: '3M',
    tags: ['all', 'household', 'broom', '3m'],
  },
  {
    id: '3',
    url: 'products/3',
    name: 'Toothbrush',
    status: 'active',
    inventory: 26,
    type: 'hygeine',
    vendor: 'Oral-B',
    tags: ['all', 'hygeine', 'toothbrush', 'oral-b'],
  },
];

export const getProductById = (id: string) =>
  products.find((product) => product.id === id);

export default products;
