import React, { Suspense, useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { getProduct } from '../lib/api';
import { trackPageVisit } from '../lib/funnel';
import { trackEvent } from '../utils/FacebookPixel';
import { findLanding } from './registry';

const PAGE_BACKGROUND = '#F5EFE6';

// Same background as the landing pages, so nothing flashes while the page code arrives
const Waiting = () => <div style={{ minHeight: '100vh', background: PAGE_BACKGROUND }} aria-busy="true" />;

// /l/:slug — loads the landing page's product (already started by index.html) and its page code in parallel
const LandingRoute = () => {
    const { slug } = useParams();
    const landing = findLanding(slug);
    const productId = landing?.productId;
    const [state, setState] = useState({ status: 'loading', product: null });
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!productId) return undefined;
        let cancelled = false;
        getProduct(productId)
            .then((product) => {
                if (cancelled) return;
                setState({ status: 'ready', product });
                trackPageVisit(slug, product._id);
                trackEvent('ViewContent', {
                    content_ids: [product._id],
                    content_name: product.title,
                    content_type: 'product',
                    currency: 'DZD',
                    value: product.price,
                });
            })
            .catch(() => {
                if (!cancelled) setState({ status: 'error', product: null });
            });
        return () => {
            cancelled = true;
        };
    }, [slug, productId, retryCount]);

    if (!landing) return <Navigate to="/" replace />;

    if (state.status === 'error') {
        return (
            <div dir="rtl" style={{ minHeight: '100vh', background: PAGE_BACKGROUND }} className="flex flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-xl font-bold text-gray-800">تعذّر تحميل الصفحة</p>
                <p className="text-gray-600">تحقق من اتصالك بالإنترنت ثم أعد المحاولة.</p>
                <button
                    type="button"
                    onClick={() => {
                        setState({ status: 'loading', product: null });
                        setRetryCount((count) => count + 1);
                    }}
                    className="bg-black text-white px-8 py-3 rounded-full font-bold"
                >
                    إعادة المحاولة
                </button>
                <a href="tel:0662241056" className="font-medium text-gray-800">أو اتصلي بنا: 0662241056</a>
            </div>
        );
    }

    if (state.status !== 'ready') return <Waiting />;

    const { Page } = landing;
    return (
        <Suspense fallback={<Waiting />}>
            <Page slug={slug} product={state.product} />
        </Suspense>
    );
};

export default LandingRoute;
