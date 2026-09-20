import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder, getDeliveryWilayas, getDeliveryWilaya } from '../lib/api';
import { getMetaTracking } from '../lib/metaTracking';
import { trackCheckoutStep } from '../lib/funnel';
import { SHOP_PHONE } from '../lib/shop';
import { trackEvent } from '../utils/FacebookPixel';

// The order logic shared by every order form (product page, landing pages):
// ZR Express places and real delivery prices, checks, Meta events, funnel steps and sending the order.
// Each form only draws the fields; their ids must start with "checkout-" (see fieldReason).

const PHONE_PATTERN = /^(05|06|07)[0-9]{8}$/;

// If ZR Express lists can't load, the form falls back to the built-in list and fixed prices.
// That list is its own small file, downloaded only in that case.
const loadBuiltInPlaces = () => import('../data/algeriaData');

// Empty required fields are stopped by the browser itself: which funnel reason each one is
const FIELD_REASONS = {
    'checkout-name': 'name',
    'checkout-phone': 'phone',
    'checkout-wilaya': 'place',
    'checkout-commune': 'place',
    'checkout-office': 'office',
    'checkout-address': 'address',
};
const fieldReason = (id = '') => FIELD_REASONS[id] || (id.startsWith('checkout-size') ? 'size' : null);

// Arabic keyboards type ٠١٢…: turn them into 012… before keeping digits only
const toLatinDigits = (text) => text
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0));

// "0661 23 45 67", "٠٦٦١٢٣٤٥٦٧", "+213 661 23 45 67" -> "0661234567"
const cleanPhone = (raw) => {
    let digits = toLatinDigits(raw).replace(/\D/g, '');
    if (digits.startsWith('00213')) digits = digits.slice(2);
    if (digits.startsWith('213')) {
        // Still typing after the country code: keep it until the number is complete
        return digits.length >= 12 ? `0${digits.slice(3, 12)}` : digits;
    }
    return digits.slice(0, 10);
};

/**
 * @param product   the product being ordered
 * @param items     one entry per piece: { color, size } (the product's color and size objects)
 * @param itemPrice price of all the pieces (the pack price); the server checks it
 * @param landing   page key for the stats: a landing slug, or "p-<productId>" for the product page
 * @param onSizeMissing called with the index of the first piece without a size
 */
export const useCheckout = ({ product, items, itemPrice, landing, onSizeMissing }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        wilaya: '', // ZR wilaya id, or the Arabic name with the built-in list
        commune: '', // ZR commune id, or the commune name with the built-in list
        officeId: '',
        address: '',
        deliveryType: 'home' // 'home' or 'desk'
    });

    const [mode, setMode] = useState('loading'); // loading | zr | builtin
    const [zrWilayas, setZrWilayas] = useState([]);
    const [wilayaDetails, setWilayaDetails] = useState(null); // { id, communes, offices }
    const [builtIn, setBuiltIn] = useState(null); // { wilayas, getShippingRate }
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const checkoutStarted = useRef(false);
    const requestedWilaya = useRef('');
    const stepsSent = useRef({});

    const quantity = items.length;
    const productId = product._id;

    const switchToBuiltInPlaces = useCallback(() => {
        loadBuiltInPlaces().then((module) => {
            setBuiltIn(module);
            setMode('builtin');
            setFormData(prev => ({ ...prev, wilaya: '', commune: '', officeId: '' }));
        });
    }, []);

    // ZR's wilayas with real prices, loaded after the page appears (cached by Vercel)
    useEffect(() => {
        let cancelled = false;
        getDeliveryWilayas()
            .then((data) => {
                if (cancelled) return;
                setZrWilayas(data.wilayas || []);
                setMode('zr');
            })
            .catch(() => {
                if (!cancelled) switchToBuiltInPlaces();
            });
        return () => {
            cancelled = true;
        };
    }, [switchToBuiltInPlaces]);

    // Where customers stop in the form: each step counted once per visit, each error reason once
    const reportStep = useCallback((step, details = {}) => {
        const key = step === 'error' ? `error:${details.reason}` : step;
        if (stepsSent.current[key]) return;
        stepsSent.current[key] = true;
        trackCheckoutStep(step, { productId, ...(landing && { landing }), ...details });
    }, [productId, landing]);

    // First interaction with the form = the customer started checking out
    const handleFormFocus = useCallback(() => {
        if (checkoutStarted.current) return;
        checkoutStarted.current = true;
        trackEvent('InitiateCheckout', {
            content_ids: [productId],
            content_name: product.title,
            content_type: 'product',
            currency: 'DZD',
            value: itemPrice,
            num_items: quantity
        });
        reportStep('checkout');
    }, [productId, product.title, itemPrice, quantity, reportStep]);

    const fail = (reason, message) => {
        setErrorMessage(message);
        reportStep('error', { reason });
    };

    // React's onInvalid bubbles up to the form, so one handler sees every field the browser stops
    const handleInvalid = (e) => {
        const reason = fieldReason(e.target.id);
        if (reason) reportStep('error', { reason });
    };

    const updateField = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));
    const setDeliveryType = (deliveryType) => setFormData(prev => ({ ...prev, deliveryType }));

    const handleWilayaChange = (e) => {
        const value = e.target.value;
        if (mode === 'zr') {
            setFormData(prev => ({ ...prev, wilaya: value, commune: '', officeId: '' }));
            setWilayaDetails(null);
            requestedWilaya.current = value;
            if (!value) return;
            const chosen = zrWilayas.find(w => w.id === value);
            if (chosen) reportStep('wilaya', { wilaya: chosen.code, shipping: chosen.home ?? undefined });
            getDeliveryWilaya(value)
                .then((details) => {
                    if (requestedWilaya.current === value) setWilayaDetails(details);
                })
                .catch(() => switchToBuiltInPlaces());
            return;
        }
        // Built-in list: picking a wilaya also picks its first commune
        const wilaya = builtIn?.wilayas.find(w => w.name === value);
        setFormData(prev => ({ ...prev, wilaya: value, commune: wilaya?.communes[0] || '' }));
        if (wilaya) reportStep('wilaya', { wilaya: Number(wilaya.code), shipping: builtIn.getShippingRate(wilaya.code).home });
    };

    const handlePhoneChange = useCallback((e) => {
        const phone = cleanPhone(e.target.value);
        setFormData(prev => ({ ...prev, phone }));
    }, []);

    // --- Delivery options and price for the chosen place ---
    const zrWilaya = mode === 'zr' ? zrWilayas.find(w => w.id === formData.wilaya) : null;
    const zrCommune = wilayaDetails?.communes.find(c => c.id === formData.commune) || null;
    const offices = useMemo(() => {
        const list = wilayaDetails?.offices || [];
        // Offices in the customer's own commune first
        return zrCommune ? [...list].sort((a, b) => (b.commune === zrCommune.name) - (a.commune === zrCommune.name)) : list;
    }, [wilayaDetails, zrCommune]);
    const builtInWilaya = mode === 'builtin' ? builtIn?.wilayas.find(w => w.name === formData.wilaya) : null;

    let homePrice = null;
    let deskPrice = null;
    if (mode === 'zr') {
        homePrice = zrCommune ? zrCommune.home : zrWilaya?.home ?? null;
        deskPrice = offices.length ? (zrCommune ? zrCommune.pickup : zrWilaya?.pickup ?? null) : null;
    } else if (mode === 'builtin' && builtIn) {
        const rates = builtIn.getShippingRate(builtInWilaya ? builtInWilaya.code : 'default');
        homePrice = rates.home;
        deskPrice = rates.desk;
    }

    // Prices are shown only once a wilaya is chosen (and, with ZR, once its communes are loaded)
    const placeChosen = mode === 'zr' ? Boolean(zrWilaya && wilayaDetails) : Boolean(builtInWilaya);
    const homeAvailable = !placeChosen || homePrice != null;
    const deskAvailable = !placeChosen || deskPrice != null;
    // If the chosen option isn't offered here, use the other one
    const deliveryType = formData.deliveryType === 'desk' && !deskAvailable ? 'home'
        : formData.deliveryType === 'home' && !homeAvailable && deskAvailable ? 'desk'
            : formData.deliveryType;
    const shippingPrice = (deliveryType === 'home' ? homePrice : deskPrice) ?? 0;
    const totalPrice = itemPrice + shippingPrice;
    const selectedOffice = deliveryType === 'desk' ? offices.find(o => o.id === formData.officeId) : null;

    const communeOptions = mode === 'zr' ? (wilayaDetails?.communes || []) : (builtInWilaya?.communes || []);
    const communesLoading = mode === 'zr' && Boolean(formData.wilaya) && !wilayaDetails;

    const handleSubmit = async (e) => {
        e.preventDefault();
        reportStep('submit', { pieces: quantity });

        // The server refuses pieces without a size, so ask for it here first
        const missingSize = items.findIndex((item) => item.color?.sizes?.length && !item.size);
        if (missingSize >= 0) {
            fail('size', quantity > 1 ? `يرجى اختيار مقاس الطقم ${missingSize + 1}` : 'يرجى اختيار المقاس أولاً');
            onSizeMissing?.(missingSize);
            return;
        }

        if (!PHONE_PATTERN.test(formData.phone)) {
            fail('phone', 'يرجى إدخال رقم هاتف صحيح (05، 06، أو 07)');
            return;
        }

        if (mode === 'zr' && (!zrWilaya || !zrCommune)) {
            fail('place', 'يرجى اختيار الولاية والبلدية');
            return;
        }

        if ((deliveryType === 'home' ? homePrice : deskPrice) == null) {
            fail('unavailable', `التوصيل غير متوفر لهذه البلدية. يرجى الاتصال بنا على ${SHOP_PHONE}.`);
            return;
        }

        if (deliveryType === 'home' && !formData.address) {
            fail('address', 'العنوان مطلوب للتوصيل للمنزل');
            return;
        }

        if (mode === 'zr' && deliveryType === 'desk' && !selectedOffice) {
            fail('office', 'يرجى اختيار مكتب ZR الذي تريد الاستلام منه');
            return;
        }

        setSubmitting(true);
        setErrorMessage('');

        const customer = mode === 'zr'
            ? {
                name: formData.name,
                phone: formData.phone,
                wilaya: zrWilaya.name,
                commune: zrCommune.name,
                address: deliveryType === 'home' ? formData.address : '',
                deliveryType,
                zr: {
                    wilayaId: zrWilaya.id,
                    communeId: zrCommune.id,
                    ...(selectedOffice && { hubId: selectedOffice.id })
                }
            }
            : {
                name: formData.name,
                phone: formData.phone,
                wilaya: formData.wilaya,
                commune: formData.commune,
                address: deliveryType === 'home' ? formData.address : '',
                deliveryType
            };

        const pieces = items.map((item) => ({ color: item.color?.name, size: item.size?.value }));
        const orderData = {
            product: productId,
            // `variant` for older servers; `items` lists every piece of a pack
            variant: pieces[0],
            items: pieces,
            ...(landing && { landing }),
            customer,
            pricing: {
                itemPrice,
                shippingPrice,
                totalPrice
            },
            // Meta cookies and page address: lets the server's Purchase match the ad click
            tracking: getMetaTracking()
        };

        try {
            const savedOrder = await createOrder(orderData);
            // The server sets the real prices; fall back to ours if an old backend answers
            const pricing = savedOrder?.pricing || { itemPrice, shippingPrice, totalPrice };

            // Lead for Meta. The Purchase is sent by the server when the order is confirmed by phone.
            // Same event id as the server's Lead, so Meta counts it once.
            trackEvent('Lead', {
                currency: 'DZD',
                value: pricing.itemPrice,
                content_name: product.title,
                content_ids: [productId],
                content_type: 'product',
                num_items: quantity
            }, savedOrder?._id ? `lead_${savedOrder._id}` : undefined);

            navigate('/merci', {
                state: {
                    order: {
                        name: formData.name,
                        phone: formData.phone,
                        wilaya: customer.wilaya,
                        commune: customer.commune,
                        address: customer.address,
                        deliveryType,
                        office: selectedOffice?.name,
                        productTitle: product.title,
                        color: pieces[0]?.color,
                        size: pieces[0]?.size,
                        items: pieces,
                        itemPrice: pricing.itemPrice,
                        shippingPrice: pricing.shippingPrice,
                        totalPrice: pricing.totalPrice
                    }
                }
            });
        } catch (err) {
            console.error(err);
            setSubmitting(false);
            if (err.status === 409) {
                fail('sold_out', 'عذراً، هذا المقاس نفد. يرجى اختيار مقاس آخر.');
            } else if (err.status === 429) {
                fail('rate_limit', `تم إرسال طلبات كثيرة. يرجى الاتصال بنا على ${SHOP_PHONE}.`);
            } else {
                fail('server', 'حدث خطأ ما. يرجى المحاولة مرة أخرى.');
            }
        }
    };

    return {
        formData,
        updateField,
        setDeliveryType,
        handleWilayaChange,
        handlePhoneChange,
        handleFormFocus,
        handleInvalid,
        handleSubmit,
        reportStep,
        mode,
        zrWilayas,
        builtIn,
        communeOptions,
        communesLoading,
        offices,
        selectedOffice,
        deliveryType,
        homePrice,
        deskPrice,
        homeAvailable,
        deskAvailable,
        placeChosen,
        shippingPrice,
        totalPrice,
        submitting,
        errorMessage,
    };
};
