import { trackCustomEvent } from '../utils/FacebookPixel';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const EVENT_NAMES = {
    wilaya: 'CheckoutWilaya', // wilaya chosen: the delivery price is now shown
    submit: 'CheckoutSubmit', // order button pressed
    error: 'CheckoutError', // the form stopped the customer (details.reason says why)
};

// One order-form step: to Meta as a custom event, and to the backend logs (Render).
// No personal data: only the step, the reason, the product and the delivery price.
export const trackCheckoutStep = (step, details = {}) => {
    trackCustomEvent(EVENT_NAMES[step], details);
    try {
        // A text beacon: no CORS preflight, and it is still sent if the customer leaves the page
        if (BACKEND_URL && navigator.sendBeacon) {
            navigator.sendBeacon(`${BACKEND_URL}/api/funnel`, JSON.stringify({ step, ...details }));
        }
    } catch {
        // Measuring must never break the order form
    }
};
