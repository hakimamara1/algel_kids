import React from 'react';
import { Link } from 'react-router-dom';
import { useCheckout } from '../../checkout/useCheckout';
import { content } from './content';

const priceLabel = (price) => (price == null ? 'غير متوفر' : `${price} دج`);

// The ginseng page's order form: ZR wilaya → commune → home or office, then how many boxes.
// One box is one box: no color or size to choose, so the form has no piece rows.
// All the order logic (prices, checks, Pixel/CAPI, funnel) is the shared useCheckout.
const GinsengOrderForm = ({ slug, product, items, packPrice, onPack }) => {
    const {
        formData, updateField, setDeliveryType, handleWilayaChange, handlePhoneChange,
        handleFormFocus, handleInvalid, handleSubmit, reportStep,
        mode, zrWilayas, builtIn, communeOptions, communesLoading, offices, selectedOffice,
        deliveryType, homePrice, deskPrice, homeAvailable, deskAvailable, placeChosen,
        shippingPrice, totalPrice, submitting, errorMessage,
    } = useCheckout({ product, items, itemPrice: packPrice, landing: slug });

    const quantity = items.length;
    const packLabel = content.packs.find((pack) => pack.quantity === quantity)?.label || `${quantity} علب`;
    const optionPrice = (price) => (placeChosen ? ` · ${priceLabel(price)}` : '');

    return (
        <form className="gs-form" onSubmit={handleSubmit} onFocus={handleFormFocus} onInvalid={handleInvalid}>
            <p className="gs-form-step">معلوماتك</p>

            <div className="gs-field">
                <label htmlFor="checkout-name">الاسم الكامل</label>
                <input id="checkout-name" type="text" required autoComplete="name" placeholder="اسمك ولقبك"
                    value={formData.name} onChange={updateField('name')} />
            </div>

            <div className="gs-field">
                <label htmlFor="checkout-phone">رقم الهاتف</label>
                <input id="checkout-phone" type="tel" inputMode="numeric" autoComplete="tel-national" required dir="ltr"
                    placeholder="05XX XX XX XX" value={formData.phone} onChange={handlePhoneChange} />
            </div>

            <div className="gs-field-row">
                <div className="gs-field">
                    <label htmlFor="checkout-wilaya">الولاية</label>
                    <select id="checkout-wilaya" required disabled={mode === 'loading'} value={formData.wilaya} onChange={handleWilayaChange}>
                        <option value="">{mode === 'loading' ? 'جاري التحميل...' : 'اختر الولاية'}</option>
                        {mode === 'zr' && zrWilayas.map((w) => (
                            <option key={w.id} value={w.id}>{String(w.code).padStart(2, '0')} - {w.name}</option>
                        ))}
                        {mode === 'builtin' && builtIn?.wilayas.map((w) => (
                            <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                </div>
                <div className="gs-field">
                    <label htmlFor="checkout-commune">البلدية</label>
                    <select id="checkout-commune" required disabled={!communeOptions.length} value={formData.commune} onChange={updateField('commune')}>
                        {mode === 'zr' && <option value="">{communesLoading ? 'جاري التحميل...' : 'اختر البلدية'}</option>}
                        {mode === 'zr'
                            ? communeOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                            : communeOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="gs-field">
                <span className="gs-label" id="gs-delivery-label">التوصيل</span>
                <div className="gs-pills" role="group" aria-labelledby="gs-delivery-label">
                    <button type="button" aria-pressed={deliveryType === 'home'} disabled={!homeAvailable} onClick={() => setDeliveryType('home')}>
                        لباب الدار{optionPrice(homePrice)}
                    </button>
                    <button type="button" aria-pressed={deliveryType === 'desk'} disabled={!deskAvailable} onClick={() => setDeliveryType('desk')}>
                        {mode === 'zr' ? 'مكتب ZR' : 'المكتب'}{optionPrice(deskPrice)}
                    </button>
                </div>
            </div>

            {mode === 'zr' && deliveryType === 'desk' && offices.length > 0 && (
                <div className="gs-field">
                    <label htmlFor="checkout-office">اختر المكتب</label>
                    <select id="checkout-office" required value={formData.officeId} onChange={updateField('officeId')}>
                        <option value="">اختر...</option>
                        {offices.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}{o.commune ? ` – ${o.commune}` : ''}</option>
                        ))}
                    </select>
                    {selectedOffice && (selectedOffice.street || selectedOffice.openingHours) && (
                        <small className="gs-hint">{[selectedOffice.street, selectedOffice.openingHours].filter(Boolean).join(' · ')}</small>
                    )}
                </div>
            )}

            {deliveryType === 'home' && (
                <div className="gs-field">
                    <label htmlFor="checkout-address">العنوان</label>
                    <textarea id="checkout-address" required autoComplete="street-address" rows={2}
                        placeholder="الحي، الشارع، رقم الدار..." value={formData.address} onChange={updateField('address')} />
                </div>
            )}

            <p className="gs-form-step">عدد العلب</p>
            <div className="gs-pills" role="group" aria-label="عدد العلب">
                {content.packs.map((pack) => (
                    <button key={pack.quantity} type="button" aria-pressed={pack.quantity === quantity} onClick={() => onPack(pack.quantity)}>
                        {pack.label}
                    </button>
                ))}
            </div>

            <div className="gs-summary">
                <div><span>سعر {packLabel}</span><b>{packPrice} دج</b></div>
                <div><span>سعر التوصيل</span><b>{placeChosen ? `${shippingPrice} دج` : 'اختر الولاية'}</b></div>
                <div className="gs-summary-total"><span>المجموع</span><b>{totalPrice} دج{placeChosen ? '' : ' + التوصيل'}</b></div>
            </div>

            {errorMessage && <p role="alert" className="gs-error">{errorMessage}</p>}

            <button
                type="submit"
                className="gs-btn gs-btn-green"
                disabled={submitting || mode === 'loading'}
                onClick={() => reportStep('submit', { pieces: quantity })}
            >
                {submitting ? <span className="gs-spinner" aria-label="جاري الإرسال" /> : `أكّد الطلب${placeChosen ? ` · ${totalPrice} دج` : ''}`}
            </button>
            <p className="gs-form-note">{content.formNote}</p>
            <p className="gs-privacy">
                تُستعمل معلوماتك لتوصيل طلبك ولقياس فعالية إعلاناتنا، ويُرسل رقم هاتفك مُشفّراً.{' '}
                <Link to="/confidentialite">سياسة الخصوصية</Link>
            </p>
        </form>
    );
};

export default GinsengOrderForm;
