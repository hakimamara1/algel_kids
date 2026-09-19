// Pack prices, the same rule as the server: the product's offer for that number of pieces,
// otherwise the unit price each
export const offerPrice = (product, quantity) => {
    const offer = product.offers?.find((entry) => entry.quantity === quantity);
    return offer ? offer.price : product.price * quantity;
};

// What a pack saves compared with buying the pieces one by one
export const offerSaving = (product, quantity) => Math.max(0, product.price * quantity - offerPrice(product, quantity));
