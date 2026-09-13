// Color and size chosen for the customer when the product page opens.
// The shop checks the size during the confirmation call.
const inStock = (size) => Number(size.stock) > 0;

// The first color that has a size in stock (or has no sizes at all)
export const defaultColor = (colors = []) =>
    colors.find((color) => !color.sizes?.length || color.sizes.some(inStock)) ?? colors[0] ?? null;

// The same size as before when this color has it in stock, otherwise the in-stock size
// closest to it (or to the middle of the range: 40 for 38–44)
export const pickSize = (color, preferredValue) => {
    const sizes = color?.sizes || [];
    if (!sizes.some(inStock)) return null;

    const preferredIndex = sizes.findIndex((size) => size.value === preferredValue);
    const target = preferredIndex >= 0 ? preferredIndex : Math.floor((sizes.length - 1) / 2);
    return sizes
        .map((size, index) => ({ size, distance: Math.abs(index - target) }))
        .filter(({ size }) => inStock(size))
        .sort((a, b) => a.distance - b.distance)[0].size;
};
