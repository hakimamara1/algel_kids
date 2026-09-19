import { trackCustomEvent } from '../utils/FacebookPixel';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Order-form steps that also go to Meta as custom events
// (visits and form starts are already there as ViewContent and InitiateCheckout)
const EVENT_NAMES = {
    wilaya: 'CheckoutWilaya', // wilaya chosen: the delivery price is now shown
    submit: 'CheckoutSubmit', // order button pressed
    error: 'CheckoutError', // the form stopped the customer (details.reason says why)
};

// The page key of a product page in the stats (landing pages use their slug)
export const productPageKey = (productId) => `p-${productId}`;

const sendBeacon = (body) => {
    try {
        // A text beacon: no CORS preflight, and it is still sent if the customer leaves the page
        if (BACKEND_URL && navigator.sendBeacon) {
            navigator.sendBeacon(`${BACKEND_URL}/api/funnel`, JSON.stringify(body));
        }
    } catch {
        // Measuring must never break the page
    }
};

// One order-form step: counted per page by the backend (dashboard "Landing pages"), written to
// the Render logs, and sent to Meta. No personal data: only the step, the reason, the page and prices.
export const trackCheckoutStep = (step, details = {}) => {
    if (EVENT_NAMES[step]) trackCustomEvent(EVENT_NAMES[step], details);
    sendBeacon({ step, ...details });
};

// A visitor on a page, counted once per page per browser tab
export const trackPageVisit = (landing, productId) => {
    const key = `visit:${landing}`;
    try {
        if (sessionStorage.getItem(key)) return;
        sessionStorage.setItem(key, '1');
    } catch {
        // Private browsing without storage: count the visit anyway
    }
    sendBeacon({ step: 'view', landing, productId });
};
