import { content } from './content';

// How the page names a product color ("Bleu marine" -> "كحلي")
export const colorLabel = (color) => content.colorLabels[color?.name] || color?.name || '';

// Every size of this color is out of stock
export const isSoldOut = (color) => Boolean(color?.sizes?.length) && color.sizes.every((size) => Number(size.stock) <= 0);
