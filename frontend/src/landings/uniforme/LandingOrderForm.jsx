import React from 'react';
import { Link } from 'react-router-dom';
import { useCheckout } from '../../checkout/useCheckout';
import { swatchColor } from '../../lib/colors';
import { content } from './content';
import { colorLabel, isSoldOut } from './helpers';

const priceLabel = (price) => (price == null ? 'غير متوفر' : `${price} دج`);

// The landing page's order form: ZR wilaya → commune → home or office, one row (color + size) per set.
// All the order logic (prices, checks, Pixel/CAPI, funnel) is the shared useCheckout.
const LandingOrderForm = ({ slug, product, items, packPrice, onPack, onColor, onSize, onSizeMissing }) => {
    const {
        formData, updateField, setDeliveryType, handleWilayaChange, handlePhoneChange,
        handleFormFocus, handleInvalid, handleSubmit, reportStep,
        mode, zrWilayas, builtIn, communeOptions, communesLoading, offices, selectedOffice,
        deliveryType, homePrice, deskPrice, homeAvailable, deskAvailable, placeChosen,
        shippingPrice, totalPrice, submitting, errorMessage,
    } = useCheckout({ product, items, itemPrice: packPrice, landing: slug, onSizeMissing });

    const quantity = items.length;
    const packLabel = content.packs.find((pack) => pack.quantity === quantity)?.label || `${quantity} أطقم`;
    const optionPrice = (price) => (placeChosen ? ` · ${priceLabel(price)}` : '');

    return (
        <form className="ak-form" onSubmit={handleSubmit} onFocus={handleFormFocus} onInvalid={handleInvalid}>
            <div className="ak-field">
                <label htmlFor="checkout-name">الاسم الكامل</label>
                <input id="checkout-name" type="text" required autoComplete="name" placeholder="اسمك ولقبك"
                    value={formData.name} onChange={updateField('name')} />
            </div>

            <div className="ak-field">
                <label htmlFor="checkout-phone">رقم الهاتف</label>
                <input id="checkout-phone" type="tel" inputMode="numeric" autoComplete="tel-national" required dir="ltr"
                    placeholder="05XX XX XX XX" value={formData.phone} onChange={handlePhoneChange} />
            </div>

            <div className="ak-field-row">
                <div className="ak-field">
                    <label htmlFor="checkout-wilaya">الولاية</label>
                    <select id="checkout-wilaya" required disabled={mode === 'loading'} value={formData.wilaya} onChange={handleWilayaChange}>
                        <option value="">{mode === 'loading' ? 'جاري التحميل...' : 'اختاري الولاية'}</option>
                        {mode === 'zr' && zrWilayas.map((w) => (
                            <option key={w.id} value={w.id}>{String(w.code).padStart(2, '0')} - {w.name}</option>
                        ))}
                        {mode === 'builtin' && builtIn?.wilayas.map((w) => (
                            <option key={w.code} value={w.name}>{w.code} - {w.name}</option>
                        ))}
                    </select>
                </div>
                <div className="ak-field">
                    <label htmlFor="checkout-commune">البلدية</label>
                    <select id="checkout-commune" required disabled={!communeOptions.length} value={formData.commune} onChange={updateField('commune')}>
                        {mode === 'zr' && <option value="">{communesLoading ? 'جاري التحميل...' : 'اختاري البلدية'}</option>}
                        {mode === 'zr'
                            ? communeOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)
                            : communeOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            </div>

            <div className="ak-field">
                <span className="ak-label" id="ak-delivery-label">التوصيل</span>
                <div className="ak-toggle" role="group" aria-labelledby="ak-delivery-label">
                    <button type="button" aria-pressed={deliveryType === 'home'} disabled={!homeAvailable} onClick={() => setDeliveryType('home')}>
                        لباب الدار{optionPrice(homePrice)}
                    </button>
                    <button type="button" aria-pressed={deliveryType === 'desk'} disabled={!deskAvailable} onClick={() => setDeliveryType('desk')}>
                        {mode === 'zr' ? 'مكتب ZR' : 'المكتب'}{optionPrice(deskPrice)}
                    </button>
                </div>
            </div>

            {mode === 'zr' && deliveryType === 'desk' && offices.length > 0 && (
                <div className="ak-field">
                    <label htmlFor="checkout-office">اختاري المكتب</label>
                    <select id="checkout-office" required value={formData.officeId} onChange={updateField('officeId')}>
                        <option value="">اختاري...</option>
                        {offices.map((o) => (
                            <option key={o.id} value={o.id}>{o.name}{o.commune ? ` – ${o.commune}` : ''}</option>
                        ))}
                    </select>
                    {selectedOffice && (selectedOffice.street || selectedOffice.openingHours) && (
                        <small className="ak-hint">{[selectedOffice.street, selectedOffice.openingHours].filter(Boolean).join(' · ')}</small>
                    )}
                </div>
            )}

            {deliveryType === 'home' && (
                <div className="ak-field">
                    <label htmlFor="checkout-address">العنوان</label>
                    <textarea id="checkout-address" required autoComplete="street-address" rows={2}
                        placeholder="الحي، الشارع، رقم الدار..." value={formData.address} onChange={updateField('address')} />
                </div>
            )}

            <div className="ak-field">
                <span className="ak-label" id="ak-pack-label">عدد الأطقم</span>
                <div className="ak-chips" role="group" aria-labelledby="ak-pack-label">
                    {content.packs.map((pack) => (
                        <button key={pack.quantity} type="button" aria-pressed={pack.quantity === quantity} onClick={() => onPack(pack.quantity)}>
                            {pack.label}
                        </button>
                    ))}
                </div>
            </div>

            {items.map((item, index) => (
                <fieldset key={index} className="ak-set">
                    <legend>{quantity > 1 ? `الطقم ${index + 1}` : 'اللون والمقاس'}</legend>
                    <div className="ak-set-colors" role="group" aria-label={`لون الطقم ${index + 1}`}>
                        {(product.colors || []).map((color) => {
                            const selected = item.color?.name === color.name;
                            return (
                                <button
                                    key={color.name}
                                    type="button"
                                    className={`ak-swatch ak-swatch-small${selected ? ' is-selected' : ''}`}
                                    aria-pressed={selected}
                                    disabled={isSoldOut(color)}
                                    onClick={() => onColor(index, color)}
                                >
                                    <span className="ak-swatch-dot" style={{ background: swatchColor(color.hexCode) }} />
                                    <span className="ak-swatch-label">{colorLabel(color)}</span>
                                </button>
                            );
                        })}
                    </div>
                    {item.color?.sizes?.length > 0 && (
                        <div className="ak-field">
                            <label htmlFor={`checkout-size-${index}`}>المقاس</label>
                            <select
                                id={`checkout-size-${index}`}
                                required
                                value={item.size?.value || ''}
                                onChange={(e) => onSize(index, item.color.sizes.find((size) => size.value === e.target.value) || null)}
                            >
                                <option value="">اختاري المقاس</option>
                                {item.color.sizes.map((size) => {
                                    const empty = Number(size.stock) <= 0;
                                    return (
                                        <option key={size.value} value={size.value} disabled={empty}>
                                            {size.value}{empty ? ' (نفد)' : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    )}
                </fieldset>
            ))}

            <div className="ak-card ak-summary">
                <div><span>سعر {packLabel}</span><b>{packPrice} دج</b></div>
                <div><span>سعر التوصيل</span><b>{placeChosen ? `${shippingPrice} دج` : 'اختاري الولاية'}</b></div>
                <div className="ak-summary-total"><span>المجموع</span><b>{totalPrice} دج{placeChosen ? '' : ' + التوصيل'}</b></div>
            </div>

            {errorMessage && <p role="alert" className="ak-error">{errorMessage}</p>}

            <button
                type="submit"
                className="ak-btn ak-btn-navy"
                disabled={submitting || mode === 'loading'}
                onClick={() => reportStep('submit', { pieces: quantity })}
            >
                {submitting ? <span className="ak-spinner" aria-label="جاري الإرسال" /> : `أكدي الطلب${placeChosen ? ` · ${totalPrice} دج` : ''}`}
            </button>
            <p className="ak-form-note">{content.formNote}</p>
            <p className="ak-privacy">
                تُستعمل معلوماتك لتوصيل طلبك ولقياس فعالية إعلاناتنا، ويُرسل رقم هاتفك مُشفّراً.{' '}
                <Link to="/confidentialite">سياسة الخصوصية</Link>
            </p>
        </form>
    );
};

export default LandingOrderForm;
