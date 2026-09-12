import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../lib/api';
import { wilayas, getShippingRate } from '../data/algeriaData';
import { trackEvent } from '../utils/FacebookPixel';

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1';
const PHONE_PATTERN = /^(05|06|07)[0-9]{8}$/;

const CheckoutForm = React.memo(({ product, variant, onSizeMissing }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        wilaya: '',
        commune: '',
        address: '',
        deliveryType: 'home' // 'home' or 'desk'
    });

    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const checkoutStarted = useRef(false);

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

    const selectedWilayaData = useMemo(
        () => wilayas.find(w => w.name === formData.wilaya),
        [formData.wilaya]
    );
    const availableCommunes = selectedWilayaData?.communes || [];

    const wilayaCode = selectedWilayaData ? selectedWilayaData.code : 'default';
    const rates = useMemo(() => getShippingRate(wilayaCode), [wilayaCode]);
    const shippingPrice = formData.deliveryType === 'home' ? rates.home : rates.desk;
    const totalPrice = product.price + shippingPrice;

    const updateField = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    // Picking a wilaya also picks its first commune
    const handleWilayaChange = (e) => {
        const wilaya = wilayas.find(w => w.name === e.target.value);
        setFormData(prev => ({ ...prev, wilaya: e.target.value, commune: wilaya?.communes[0] || '' }));
    };

    const handlePhoneChange = useCallback((e) => {
        const val = e.target.value.replace(/\D/g, ''); // Only numbers
        if (val.length <= 10) {
            setFormData(prev => ({ ...prev, phone: val }));
        }
    }, []);

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

        if (formData.deliveryType === 'home' && !formData.address) {
            setErrorMessage('العنوان مطلوب للتوصيل للمنزل');
            return;
        }

        setSubmitting(true);
        setErrorMessage('');

        const orderData = {
            product: product._id,
            variant: {
                color: variant?.color?.name,
                size: variant?.size?.value
            },
            customer: {
                ...formData
            },
            pricing: {
                itemPrice: product.price,
                shippingPrice,
                totalPrice
            }
        };

        try {
            const savedOrder = await createOrder(orderData);
            // The server sets the real prices; fall back to ours if an old backend answers
            const pricing = savedOrder?.pricing || { itemPrice: product.price, shippingPrice, totalPrice };

            // The order id doubles as the event id, so a future server-side
            // Conversions API event for the same order is deduplicated by Meta
            trackEvent('Purchase', {
                currency: 'DZD',
                value: pricing.totalPrice,
                content_name: product.title,
                content_ids: [product._id],
                content_type: 'product',
                num_items: 1
            }, savedOrder?._id);

            navigate('/merci', {
                state: {
                    order: {
                        name: formData.name,
                        phone: formData.phone,
                        wilaya: formData.wilaya,
                        commune: formData.commune,
                        address: formData.address,
                        deliveryType: formData.deliveryType,
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
                        value={formData.wilaya}
                        onChange={handleWilayaChange}
                        className={INPUT_CLASS}
                    >
                        <option value="">اختر...</option>
                        {wilayas.map(w => (
                            <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="checkout-commune" className={LABEL_CLASS}>البلدية</label>
                    <select
                        id="checkout-commune"
                        required
                        disabled={!availableCommunes.length}
                        value={formData.commune}
                        onChange={updateField('commune')}
                        className={`${INPUT_CLASS} disabled:bg-gray-50 disabled:text-gray-400`}
                    >
                        {availableCommunes.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Delivery Type */}
            <div className="flex bg-gray-50 p-1 rounded-xl" role="group" aria-label="طريقة التوصيل">
                <button
                    type="button"
                    aria-pressed={formData.deliveryType === 'home'}
                    onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'home' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${formData.deliveryType === 'home' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                    المنزل ({rates.home} د.ج)
                </button>
                <button
                    type="button"
                    aria-pressed={formData.deliveryType === 'desk'}
                    onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'desk' }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${formData.deliveryType === 'desk' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                    المكتب ({rates.desk} د.ج)
                </button>
            </div>

            {/* Address (Conditional) */}
            {formData.deliveryType === 'home' && (
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
                    <span>التوصيل</span>
                    <span>{shippingPrice} د.ج</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-pink-100">
                    <span>الإجمالي</span>
                    <span>{totalPrice} د.ج</span>
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
                disabled={submitting}
                className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {submitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <span>تأكيد الطلب · {totalPrice} د.ج</span>
                )}
            </button>
        </form>
    );
});

CheckoutForm.displayName = 'CheckoutForm';

export default CheckoutForm;
