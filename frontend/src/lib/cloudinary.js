// Cloudinary resizing helpers.
// index.html builds the same srcset to preload the first product photo — keep both in sync.
export const GALLERY_WIDTHS = [480, 640, 828, 1080];
export const GALLERY_SIZES = '100vw';

export const cldUrl = (url, width) => {
    if (!url || !url.includes('res.cloudinary.com')) return url;
    const parts = url.split('/upload/');
    if (parts.length !== 2) return url;
    return `${parts[0]}/upload/f_auto,q_auto,c_limit,w_${width}/${parts[1]}`;
};

export const cldSrcSet = (url, widths = GALLERY_WIDTHS) =>
    widths.map((width) => `${cldUrl(url, width)} ${width}w`).join(', ');
