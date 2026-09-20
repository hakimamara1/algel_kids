import { lazy } from 'react';
import landings from './landings.json';

// Landing pages for ad tests. Each one has its own link: /l/<slug>.
// To add one: copy a page folder, add it below and in landings.json (name + product id).
// landings.json is also read by index.html (to start loading the product early) and by the dashboard.
const PAGES = {
    uniforme: lazy(() => import('./uniforme/UniformeLanding')),
    blouse: lazy(() => import('./blouse/BlouseLanding')),
};

export const findLanding = (slug) => {
    const landing = landings[slug];
    return landing && PAGES[slug] ? { ...landing, slug, Page: PAGES[slug] } : null;
};
