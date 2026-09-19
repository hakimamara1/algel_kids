// The pieces of an order. New orders list them in `items` (a pack of 2 sets = 2 items);
// orders placed before packs existed only have `variant`.
const orderItems = (order) => {
    if (order?.items?.length) return order.items;
    return order?.variant?.color || order?.variant?.size ? [order.variant] : [];
};

const hasVariant = (item) => Boolean(item?.color && item?.size);

// "Rose 38"
const itemLabel = (item) => [item?.color, item?.size].filter(Boolean).join(' ');

module.exports = { orderItems, hasVariant, itemLabel };
