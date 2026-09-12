import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder, getDeliveryWilayas, getDeliveryWilaya } from '../lib/api';
import { getMetaTracking } from '../lib/metaTracking';
import { trackEvent } from '../utils/FacebookPixel';

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1';
const PHONE_PATTERN = /^(05|06|07)[0-9]{8}$/;

// If ZR Express lists can't load, the form falls back to the built-in list and fixed prices.
// That list is its own small file, downloaded only in that case.
const loadBuiltInPlaces = () => import('../data/algeriaData');

const priceLabel = (price) => (price == null ? 'غير متوفر' : `${price} د.ج`);

const CheckoutForm = React.memo(({ product, variant, onSizeMissing }) => {
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

    // First interaction with the form = the customer started checking out
    const handleFormFocus = useCallback(() => {
        if (checkoutStarted.current) return;
        checkoutStarted.current = true;
        trackEvent('InitiateCheckout', {
            content_ids: [product._id],
            content_name: product.title,
            content_type: 'product',
            currency: 'DZD',
            value: product.price,
            num_items: 1
        });
    }, [product._id, product.title, product.price]);

    const updateField = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const handleWilayaChange = (e) => {
        const value = e.target.value;
        if (mode === 'zr') {
            setFormData(prev => ({ ...prev, wilaya: value, commune: '', officeId: '' }));
            setWilayaDetails(null);
            requestedWilaya.current = value;
            if (!value) return;
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
    };

    const handlePhoneChange = useCallback((e) => {
        const val = e.target.value.replace(/\D/g, ''); // Only numbers
        if (val.length <= 10) {
            setFormData(prev => ({ ...prev, phone: val }));
        }
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
    const optionPrice = (price) => (placeChosen ? ` (${priceLabel(price)})` : '');
    // If the chosen option isn't offered here, use the other one
    const deliveryType = formData.deliveryType === 'desk' && !deskAvailable ? 'home'
        : formData.deliveryType === 'home' && !homeAvailable && deskAvailable ? 'desk'
            : formData.deliveryType;
    const shippingPrice = (deliveryType === 'home' ? homePrice : deskPrice) ?? 0;
    const totalPrice = product.price + shippingPrice;
    const selectedOffice = deliveryType === 'desk' ? offices.find(o => o.id === formData.officeId) : null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // The server refuses orders without a size, so ask for it here first
        if (variant?.color?.sizes?.length && !variant?.size) {
            setErrorMessage('يرجى اختيار المقاس أولاً');
            onSizeMissing?.();
            return;
        }

        if (!PHONE_PATTERN.test(formData.phone)) {
            setErrorMessage('يرجى إدخال رقم هاتف صحيح (05، 06، أو 07)');
            return;
        }

        if (mode === 'zr' && (!zrWilaya || !zrCommune)) {
            setErrorMessage('يرجى اختيار الولاية والبلدية');
            return;
        }

        if ((deliveryType === 'home' ? homePrice : deskPrice) == null) {
            setErrorMessage('التوصيل غير متوفر لهذه البلدية. يرجى الاتصال بنا على 0662241056.');
            return;
        }

        if (deliveryType === 'home' && !formData.address) {
            setErrorMessage('العنوان مطلوب للتوصيل للمنزل');
            return;
        }

        if (mode === 'zr' && deliveryType === 'desk' && !selectedOffice) {
            setErrorMessage('يرجى اختيار مكتب ZR الذي تريد الاستلام منه');
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

        const orderData = {
            product: product._id,
            variant: {
                color: variant?.color?.name,
                size: variant?.size?.value
            },
            customer,
            pricing: {
                itemPrice: product.price,
                shippingPrice,
                totalPrice
            },
            // Meta cookies and page address: lets the server's Purchase match the ad click
            tracking: getMetaTracking()
        };

        try {
            const savedOrder = await createOrder(orderData);
            // The server sets the real prices; fall back to ours if an old backend answers
            const pricing = savedOrder?.pricing || { itemPrice: product.price, shippingPrice, totalPrice };

            // Lead for Meta. The Purchase is sent by the server when the order is confirmed by phone.
            // Same event id as the server's Lead, so Meta counts it once.
            trackEvent('Lead', {
                currency: 'DZD',
                value: pricing.itemPrice,
                content_name: product.title,
                content_ids: [product._id],
                content_type: 'product'
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
                        color: variant?.color?.name,
                        size: variant?.size?.value,
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
                setErrorMessage('عذراً، هذا المقاس نفد. يرجى اختيار مقاس آخر.');
            } else if (err.status === 429) {
                setErrorMessage('تم إرسال طلبات كثيرة. يرجى الاتصال بنا على 0662241056.');
            } else {
                setErrorMessage('حدث خطأ ما. يرجى المحاولة مرة أخرى.');
            }
        }
    };

    const chosenVariant = [variant?.color?.name, variant?.size?.value].filter(Boolean).join(' · ');
    const communeOptions = mode === 'zr' ? (wilayaDetails?.communes || []) : (builtInWilaya?.communes || []);
    const communesLoading = mode === 'zr' && Boolean(formData.wilaya) && !wilayaDetails;

    return (
        <form onSubmit={handleSubmit} onFocus={handleFormFocus} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
            <h2 className="text-xl font-bold text-gray-900">شراء سريع</h2>

            {/* Name */}
            <div>
                <label htmlFor="checkout-name" className={LABEL_CLASS}>الاسم الكامل</label>
                <input
                    id="checkout-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={updateField('name')}
                    className={INPUT_CLASS}
                    placeholder="الاسم واللقب"
                />
            </div>

            {/* Phone */}
            <div>
                <label htmlFor="checkout-phone" className={LABEL_CLASS}>رقم الهاتف</label>
                <input
                    id="checkout-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    required
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className={`${INPUT_CLASS} text-left`}
                    style={{ direction: 'ltr' }}
                    placeholder="05 XX XX XX XX"
                />
            </div>

            {/* Wilaya & Commune */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="checkout-wilaya" className={LABEL_CLASS}>الولاية</label>
                    <select
                        id="checkout-wilaya"
                        required
                        disabled={mode === 'loading'}
                        value={formData.wilaya}
                        onChange={handleWilayaChange}
                        className={`${INPUT_CLASS} disabled:bg-gray-50 disabled:text-gray-400`}
                    >
                        <option value="">{mode === 'loading' ? 'جاري التحميل...' : 'اختر...'}</option>
                        {mode === 'zr' && zrWilayas.map(w => (
                            <option key={w.id} value={w.id}>{String(w.code).padStart(2, '0')} - {w.name}</option>
                        ))}
                        {mode === 'builtin' && builtIn?.wilayas.map(w => (
                            <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="checkout-commune" className={LABEL_CLASS}>البلدية</label>
                    <select
                        id="checkout-commune"
                        required
                        disabled={!communeOptions.length}
                        value={formData.commune}
                        onChange={updateField('commune')}
                        className={`${INPUT_CLASS} disabled:bg-gray-50 disabled:text-gray-400`}
                    >
                        {mode === 'zr' && (
                            <option value="">{communesLoading ? 'جاري التحميل...' : 'اختر...'}</option>
                        )}
                        {mode === 'zr'
                            ? communeOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                            : communeOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            {/* Delivery Type */}
            <div className="flex bg-gray-50 p-1 rounded-xl" role="group" aria-label="طريقة التوصيل">
                <button
                    type="button"
                    aria-pressed={deliveryType === 'home'}
                    disabled={!homeAvailable}
                    onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'home' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${deliveryType === 'home' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                    المنزل{optionPrice(homePrice)}
                </button>
                <button
                    type="button"
                    aria-pressed={deliveryType === 'desk'}
                    disabled={!deskAvailable}
                    onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'desk' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${deliveryType === 'desk' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                    {mode === 'zr' ? 'مكتب ZR' : 'المكتب'}{optionPrice(deskPrice)}
                </button>
            </div>

            {/* ZR office (stop desk) */}
            {mode === 'zr' && deliveryType === 'desk' && offices.length > 0 && (
                <div>
                    <label htmlFor="checkout-office" className={LABEL_CLASS}>اختر المكتب</label>
                    <select
                        id="checkout-office"
                        required
                        value={formData.officeId}
                        onChange={updateField('officeId')}
                        className={INPUT_CLASS}
                    >
                        <option value="">اختر...</option>
                        {offices.map(o => (
                            <option key={o.id} value={o.id}>{o.name}{o.commune ? ` – ${o.commune}` : ''}</option>
                        ))}
                    </select>
                    {selectedOffice && (selectedOffice.street || selectedOffice.openingHours) && (
                        <p className="mt-1 text-xs text-gray-500">
                            {[selectedOffice.street, selectedOffice.openingHours && `🕘 ${selectedOffice.openingHours}`].filter(Boolean).join(' · ')}
                        </p>
                    )}
                </div>
            )}

            {/* Address (home delivery) */}
            {deliveryType === 'home' && (
                <div>
                    <label htmlFor="checkout-address" className={LABEL_CLASS}>عنوان المنزل</label>
                    <textarea
                        id="checkout-address"
                        required
                        autoComplete="street-address"
                        value={formData.address}
                        onChange={updateField('address')}
                        className={`${INPUT_CLASS} min-h-[80px]`}
                        placeholder="الحي، الشارع، رقم المنزل..."
                    />
                </div>
            )}

            {/* Summary */}
            <div className="bg-pink-50 p-4 rounded-xl space-y-2">
                <div className="flex justify-between gap-3 text-sm text-gray-600">
                    <span className="truncate">{product.title}{chosenVariant && ` · ${chosenVariant}`}</span>
                    <span className="whitespace-nowrap">{product.price} د.ج</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span>التوصيل{mode === 'zr' ? ' (ZR Express)' : ''}</span>
                    <span>{placeChosen ? `${shippingPrice} د.ج` : 'اختر الولاية'}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-pink-100">
                    <span>الإجمالي</span>
                    <span>{totalPrice} د.ج{placeChosen ? '' : ' + التوصيل'}</span>
                </div>
                <p className="text-xs text-gray-500">الدفع عند الاستلام، لا تدفع أي شيء الآن.</p>
            </div>

            {/* Error Message */}
            {errorMessage && (
                <div role="alert" className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">
                    {errorMessage}
                </div>
            )}

            {/* Submit Button */}
            <button
                type="submit"
                disabled={submitting || mode === 'loading'}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <span>{placeChosen ? `تأكيد الطلب · ${totalPrice} د.ج` : 'تأكيد الطلب'}</span>
                )}
            </button>

            {/* Privacy notice */}
            <p className="text-xs text-gray-400 text-center leading-relaxed">
                تُستعمل معلوماتك لتوصيل طلبك ولقياس فعالية إعلاناتنا، ويُرسل رقم هاتفك مُشفّراً.{' '}
                <Link to="/confidentialite" className="underline hover:text-gray-600">سياسة الخصوصية</Link>
            </p>
        </form>
    );
});

CheckoutForm.displayName = 'CheckoutForm';

export default CheckoutForm;
