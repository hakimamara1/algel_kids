// Browser details that let Meta match a later server event (Purchase) to the ad click.
// Sent with the order; the server adds the IP address and browser itself.
const readCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : undefined;
};

// The Pixel saves the ad click in the _fbc cookie; if it couldn't, rebuild it from ?fbclid=
const clickId = () => {
    const cookie = readCookie('_fbc');
    if (cookie) return cookie;
    const fbclid = new URLSearchParams(window.location.search).get('fbclid');
    return fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined;
};

export const getMetaTracking = () => ({
    fbp: readCookie('_fbp'),
    fbc: clickId(),
    sourceUrl: window.location.href.slice(0, 500),
});
