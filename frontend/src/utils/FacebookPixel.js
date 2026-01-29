import ReactPixel from 'react-facebook-pixel';

const options = {
    autoConfig: true,
    debug: false,
};

export const initPixel = (pixelId) => {
    ReactPixel.init(pixelId, options);
};

export const trackPageView = () => {
    ReactPixel.pageView();
};

export const trackEvent = (event, data) => {
    ReactPixel.track(event, data);
};
