const customers = [
  {
    id: '341',
    url: 'customers/341',
    name: 'Mae Jemison',
    location: 'Decatur, USA',
    orders: 20,
    tags: ['VIP', 'Insiders'],
    amountSpent: '$2,400',
    contact: 'maeTheForceBWithU@jedi.com',
  },
  {
    id: '256',
    url: 'customers/256',
    name: 'Ellen Ochoa',
    location: 'Los Angeles, USA',
    orders: 30,
    tags: ['VIP'],
    amountSpent: '$140',
    contact: 'extensisbility@host.com',
  },
];

export const getCusomterById = (id: string) =>
  customers.find((customer) => customer.id === id);

export default customers;
