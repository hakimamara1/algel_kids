// The pieces of an order: packs list them in `items`, older orders only have `variant`
export const orderPieces = (order) => {
    if (order?.items?.length) return order.items;
    return order?.variant?.color || order?.variant?.size ? [order.variant] : [];
};
