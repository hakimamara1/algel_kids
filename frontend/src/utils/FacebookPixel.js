// The Meta Pixel base code lives in index.html so PageView fires before React loads.
// These helpers only queue events on the global fbq.
const fbq = (...args) => {
    if (typeof window.fbq === 'function') window.fbq(...args);
};

export const trackPageView = () => {
    fbq('track', 'PageView');
};

// eventId lets Meta deduplicate this event against a future Conversions API (server) event
export const trackEvent = (event, data, eventId) => {
    if (eventId) fbq('track', event, data, { eventID: String(eventId) });
    else fbq('track', event, data);
};
