import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useCheckout } from '../checkout/useCheckout';
import { productPageKey } from '../lib/funnel';

const INPUT_CLASS = 'w-full px-4 py-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition-all';
const LABEL_CLASS = 'block text-sm font-medium text-gray-700 mb-1';

const priceLabel = (price) => (price == null ? 'غير متوفر' : `${price} د.ج`);

// The product page's order form (one piece). The order logic is shared with landing pages (useCheckout).
const CheckoutForm = React.memo(({ product, variant, onSizeMissing, onChangeVariant }) => {
    const items = useMemo(() => [{ color: variant?.color, size: variant?.size }], [variant?.color, variant?.size]);
    const checkout = useCheckout({
        product,
        items,
        itemPrice: product.price,
        landing: productPageKey(product._id),
        onSizeMissing,
    });
    const {
        formData, updateField, setDeliveryType, handleWilayaChange, handlePhoneChange,
        handleFormFocus, handleInvalid, handleSubmit,
        mode, zrWilayas, builtIn, communeOptions, communesLoading, offices, selectedOffice,
        deliveryType, homePrice, deskPrice, homeAvailable, deskAvailable, placeChosen,
        shippingPrice, totalPrice, submitting, errorMessage,
    } = checkout;

    const optionPrice = (price) => (placeChosen ? ` (${priceLabel(price)})` : '');
    const chosenVariant = [variant?.color?.name, variant?.size?.value].filter(Boolean).join(' · ');

    return (
        <form onSubmit={handleSubmit} onFocus={handleFormFocus} onInvalid={handleInvalid} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-5">
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
                    onClick={() => setDeliveryType('home')}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${deliveryType === 'home' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500'}`}
                >
                    المنزل{optionPrice(homePrice)}
                </button>
                <button
                    type="button"
                    aria-pressed={deliveryType === 'desk'}
                    disabled={!deskAvailable}
                    onClick={() => setDeliveryType('desk')}
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
                    <span className="truncate">{product.title}</span>
                    <span className="whitespace-nowrap">{product.price} د.ج</span>
                </div>
                {chosenVariant && (
                    <div className="flex justify-between items-center gap-3 text-sm text-gray-600">
                        <span className="min-w-0 truncate">اللون · المقاس: <b className="text-gray-900">{chosenVariant}</b></span>
                        {onChangeVariant && (
                            <button type="button" onClick={onChangeVariant} className="shrink-0 text-pink-600 font-semibold underline underline-offset-2">
                                تغيير
                            </button>
                        )}
                    </div>
                )}
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

            {/* Submit Button (the press is counted even when the browser stops an empty field) */}
            <button
                type="submit"
                onClick={() => checkout.reportStep('submit', { pieces: 1 })}
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
