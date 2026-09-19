// Meta's browser ids that let a later server event (Lead, Purchase) match the ad click.
// The Pixel writes the _fbp and _fbc cookies; we pass them on EXACTLY as they are.
// Meta refuses an fbc whose click id was changed in any way ("fbclid was modified").

// fb.<domain level>.<time>.<click id>  — a real click id is long
const FBP_PATTERN = /^fb\.\d\.\d{10,}\.\d+$/;
const FBC_PATTERN = /^fb\.\d\.\d{10,}\.[A-Za-z0-9_-]{20,}$/;
const CLICK_ID_PATTERN = /^[A-Za-z0-9_-]{20,}$/;

// Read without decoding: decoding could change the value Meta expects
const readCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? match[1] : '';
};

// The level counts the parts of the domain the cookie belongs to:
// "algel-kids.vercel.app" = 2, like the Pixel writes it
const domainLevel = () => Math.max(window.location.hostname.split('.').length - 1, 0);

// The fbclid exactly as it stands in the address (no decoding, no cleaning)
const urlClickId = () => {
    const match = window.location.search.match(/[?&]fbclid=([^&#]*)/);
    return match ? match[1] : '';
};

// The Pixel's cookie wins. Only if it is missing (Pixel blocked, or the customer came back later)
// do we build the value ourselves from the address, in Meta's format.
const clickId = () => {
    const cookie = readCookie('_fbc');
    if (FBC_PATTERN.test(cookie)) return cookie;

    const fbclid = urlClickId();
    return CLICK_ID_PATTERN.test(fbclid) ? `fb.${domainLevel()}.${Date.now()}.${fbclid}` : '';
};

export const getMetaTracking = () => {
    const fbp = readCookie('_fbp');
    const fbc = clickId();
    return {
        // Anything that doesn't look like Meta's own value is left out, never repaired
        ...(FBP_PATTERN.test(fbp) && { fbp }),
        ...(fbc && { fbc }),
        sourceUrl: window.location.href.slice(0, 500),
    };
};
