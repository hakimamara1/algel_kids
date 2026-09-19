import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cldSrcSet, cldUrl } from '../../lib/cloudinary';
import { swatchColor } from '../../lib/colors';
import { defaultColor, pickSize } from '../../lib/variants';
import { trackEvent } from '../../utils/FacebookPixel';
import { offerPrice, offerSaving } from '../offers';
import { content, FACEBOOK_PAGE, SHOP_PHONE, WHATSAPP_NUMBER } from './content';
import { colorLabel, isSoldOut } from './helpers';
import Icon from './Icons';
import LandingOrderForm from './LandingOrderForm';
import './uniforme.css';

// Keep in sync with the hero preload in index.html
const HERO_SIZES = '(min-width: 900px) 380px, 300px';
const LOGO = '/landings/angels-kids-logo.webp';

const scrollGently = (element, block = 'start') => {
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block });
};

// "Uniforme scolaire" landing page (design: Angels Kids — School Uniform Landing Page)
const UniformeLanding = ({ slug, product }) => {
    // One entry per set of the chosen pack, each with its own color and size (a size is chosen for her)
    const [items, setItems] = useState(() => {
        const color = defaultColor(product.colors);
        const size = pickSize(color);
        return Array.from({ length: content.defaultPack }, () => ({ color, size }));
    });
    const [formOnScreen, setFormOnScreen] = useState(false);
    const addToCartSent = useRef(false);
    const formSectionRef = useRef(null);

    const quantity = items.length;
    const packPrice = offerPrice(product, quantity);
    const heroColor = items[0]?.color;
    const heroImage = heroColor?.images?.[0] || product.images?.[0];
    const detailImage = product.images?.[0];

    // Every photo of every color, once
    const gallery = useMemo(() => {
        const seen = new Set();
        return (product.colors || []).flatMap((color) => color.images || []).filter((image) => {
            if (!image?.url || seen.has(image.url)) return false;
            seen.add(image.url);
            return true;
        });
    }, [product.colors]);

    // The sticky order bar hides while the form is on screen
    useEffect(() => {
        const section = formSectionRef.current;
        if (!section || !('IntersectionObserver' in window)) return undefined;
        const observer = new IntersectionObserver(([entry]) => setFormOnScreen(entry.isIntersecting));
        observer.observe(section);
        return () => observer.disconnect();
    }, []);

    // The customer choosing a pack, color or size herself is the "add to cart" moment
    const sendAddToCart = useCallback((count) => {
        if (addToCartSent.current) return;
        addToCartSent.current = true;
        trackEvent('AddToCart', {
            content_ids: [product._id],
            content_name: product.title,
            content_type: 'product',
            currency: 'DZD',
            value: offerPrice(product, count),
            num_items: count,
        });
    }, [product]);

    const choosePack = (count) => {
        setItems((prev) => (count > prev.length
            // New sets start like the last one; she can change them in the form
            ? [...prev, ...Array.from({ length: count - prev.length }, () => prev[prev.length - 1])]
            : prev.slice(0, count)));
        sendAddToCart(count);
    };

    // The color picker at the top dresses every set in that color (each keeps its size when possible)
    const chooseColorForAll = (color) => {
        setItems((prev) => prev.map((item) => ({ color, size: pickSize(color, item.size?.value) })));
        sendAddToCart(quantity);
    };

    const chooseColor = (index, color) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { color, size: pickSize(color, item.size?.value) } : item)));
        sendAddToCart(quantity);
    };

    const chooseSize = (index, size) => {
        setItems((prev) => prev.map((item, i) => (i === index ? { ...item, size } : item)));
        sendAddToCart(quantity);
    };

    const handleSizeMissing = useCallback((index) => {
        const select = document.getElementById(`checkout-size-${index}`);
        scrollGently(select, 'center');
        select?.focus({ preventScroll: true });
    }, []);

    const scrollToForm = () => scrollGently(formSectionRef.current);

    const hasSavings = content.packs.some((pack) => offerSaving(product, pack.quantity) > 0);

    return (
        <div className="ak-page" dir="rtl">
            {/* 1. Hero */}
            <header className="ak-hero">
                <img className="ak-logo" src={LOGO} width="150" height="80" alt="Angels Kids" />
                <div className="ak-hero-grid">
                    <div className="ak-hero-title">
                        <h1>{content.title}</h1>
                        <p>{content.subtitle}</p>
                    </div>
                    <div className="ak-hero-media">
                        {heroImage && (
                            <img
                                src={cldUrl(heroImage.url, 640)}
                                srcSet={cldSrcSet(heroImage.url)}
                                sizes={HERO_SIZES}
                                alt={`${product.title} — ${colorLabel(heroColor)}`}
                                fetchPriority="high"
                                decoding="async"
                            />
                        )}
                    </div>
                    <div className="ak-hero-buy">
                        <div className="ak-price">
                            {product.compareAtPrice > product.price && <s>{product.compareAtPrice} دج</s>}
                            <strong>{product.price} دج</strong>
                        </div>
                        <button type="button" className="ak-btn ak-btn-gold" onClick={scrollToForm}>{content.cta}</button>
                        <p className="ak-note"><Icon name="truck" size={16} color="#C9A96A" /> {content.deliveryNote}</p>
                    </div>
                </div>
            </header>

            <div className="ak-divider" />

            {/* 2. Pack offers */}
            <section className="ak-section" aria-labelledby="ak-offers-title">
                <h2 id="ak-offers-title" className="ak-title">اختاري عرضك</h2>
                {hasSavings && <p className="ak-sub">كل ما زاد العدد، كل ما وفّرتي أكثر</p>}
                <div className="ak-offers">
                    {content.packs.map((pack) => {
                        const selected = pack.quantity === quantity;
                        const price = offerPrice(product, pack.quantity);
                        const saving = offerSaving(product, pack.quantity);
                        return (
                            <button
                                key={pack.quantity}
                                type="button"
                                className={`ak-offer${selected ? ' is-selected' : ''}`}
                                aria-pressed={selected}
                                onClick={() => choosePack(pack.quantity)}
                            >
                                {saving > 0 && <span className="ak-offer-badge">وفّري {saving} دج</span>}
                                <span className="ak-offer-name">
                                    <span className="ak-radio" aria-hidden="true" />
                                    {pack.label}
                                </span>
                                <span className="ak-offer-price">
                                    <strong>{price} دج</strong>
                                    {pack.quantity > 1 && <small>{Math.round(price / pack.quantity)} دج للطقم</small>}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <div className="ak-divider" />

            {/* 3. Colors */}
            <section className="ak-section" aria-labelledby="ak-colors-title">
                <h2 id="ak-colors-title" className="ak-title">اختاري اللون</h2>
                <div className="ak-swatches">
                    {(product.colors || []).map((color) => {
                        const soldOut = isSoldOut(color);
                        const selected = items.every((item) => item.color?.name === color.name);
                        return (
                            <button
                                key={color.name}
                                type="button"
                                className={`ak-swatch${selected ? ' is-selected' : ''}`}
                                aria-pressed={selected}
                                disabled={soldOut}
                                onClick={() => chooseColorForAll(color)}
                            >
                                <span className="ak-swatch-dot" style={{ background: swatchColor(color.hexCode) }} />
                                <span className="ak-swatch-label">{colorLabel(color)}{soldOut ? ' (نفد)' : ''}</span>
                            </button>
                        );
                    })}
                </div>
            </section>

            <div className="ak-divider" />

            {/* 4. What is inside */}
            <section className="ak-section" aria-labelledby="ak-inside-title">
                <h2 id="ak-inside-title" className="ak-title">مكونات الطقم</h2>
                <ul className="ak-inside">
                    {content.inside.map((part) => (
                        <li key={part.icon}>
                            <span className="ak-icon-circle"><Icon name={part.icon} size={26} color="#1C2B45" /></span>
                            <span>{part.text}</span>
                        </li>
                    ))}
                </ul>
                <p className="ak-sub">{content.insideNote}</p>
            </section>

            {/* 5. Quality */}
            {detailImage && (
                <section className="ak-section" aria-label={content.qualityTitle}>
                    <figure className="ak-quality">
                        <img
                            src={cldUrl(detailImage.url, 640)}
                            srcSet={cldSrcSet(detailImage.url)}
                            sizes="(min-width: 900px) 420px, 90vw"
                            alt={content.qualityTitle}
                            loading="lazy"
                            decoding="async"
                        />
                    </figure>
                </section>
            )}

            {/* 6. Gallery */}
            {gallery.length > 0 && (
                <section className="ak-section ak-section-wide" aria-labelledby="ak-gallery-title">
                    <h2 id="ak-gallery-title" className="ak-title">{content.galleryTitle}</h2>
                    <div className="ak-gallery">
                        {gallery.map((image, index) => (
                            <img
                                key={image.url}
                                src={cldUrl(image.url, 480)}
                                srcSet={cldSrcSet(image.url, [320, 480, 640])}
                                sizes="(min-width: 900px) 240px, 170px"
                                alt={`${product.title} ${index + 1}`}
                                loading="lazy"
                                decoding="async"
                            />
                        ))}
                    </div>
                </section>
            )}

            <div className="ak-divider" />

            {/* 7. Size chart */}
            <section className="ak-section" aria-labelledby="ak-sizes-title">
                <h2 id="ak-sizes-title" className="ak-title">جدول المقاسات</h2>
                <table className="ak-size-table">
                    <thead>
                        <tr><th scope="col">العمر</th><th scope="col">الطول التقريبي</th></tr>
                    </thead>
                    <tbody>
                        {content.sizeChart.map(([age, height]) => (
                            <tr key={age}><td>{age}</td><td>{height}</td></tr>
                        ))}
                    </tbody>
                </table>
                <p className="ak-card ak-size-note">{content.sizeNote}</p>
            </section>

            <div className="ak-divider" />

            {/* 8. Trust */}
            <section className="ak-section" aria-labelledby="ak-trust-title">
                <h2 id="ak-trust-title" className="ak-title">{content.trustTitle}</h2>
                <ul className="ak-trust">
                    {content.trust.map((point) => (
                        <li key={point.icon} className="ak-card">
                            <Icon name={point.icon} size={24} color="#1C2B45" />
                            <span>{point.text}</span>
                        </li>
                    ))}
                </ul>
                <button type="button" className="ak-btn ak-btn-gold ak-trust-cta" onClick={scrollToForm}>{content.cta}</button>
            </section>

            {/* 10. Order form */}
            <section id="order-form" ref={formSectionRef} className="ak-form-section" aria-labelledby="ak-form-title">
                <h2 id="ak-form-title" className="ak-title">{content.formTitle}</h2>
                <LandingOrderForm
                    slug={slug}
                    product={product}
                    items={items}
                    packPrice={packPrice}
                    onPack={choosePack}
                    onColor={chooseColor}
                    onSize={chooseSize}
                    onSizeMissing={handleSizeMissing}
                />
            </section>

            {/* 11. FAQ */}
            <section className="ak-section" aria-labelledby="ak-faq-title">
                <h2 id="ak-faq-title" className="ak-title">أسئلة شائعة</h2>
                <div className="ak-faq">
                    {content.faq.map((entry) => (
                        <details key={entry.q} className="ak-card">
                            <summary>
                                <span>{entry.q}</span>
                                <Icon name="plus" size={18} color="#C9A96A" className="ak-faq-icon" />
                            </summary>
                            <p>{entry.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            <div className="ak-divider" />

            {/* 12. Footer */}
            <footer className="ak-footer">
                <img src={LOGO} width="120" height="64" alt="Angels Kids" loading="lazy" />
                <p className="ak-tagline">{content.tagline}</p>
                <div className="ak-contact">
                    <a href={`tel:${SHOP_PHONE}`} aria-label="اتصلي بنا">
                        <span className="ak-icon-circle ak-icon-small"><Icon name="phone" size={17} color="#1C2B45" /></span>
                        <span dir="ltr">{SHOP_PHONE}</span>
                    </a>
                    {WHATSAPP_NUMBER && (
                        <a href={`https://wa.me/${WHATSAPP_NUMBER}`} aria-label="واتساب">
                            <span className="ak-icon-circle ak-icon-small"><Icon name="whatsapp" size={17} color="#1C2B45" /></span>
                            <span>واتساب</span>
                        </a>
                    )}
                    <a href={FACEBOOK_PAGE} aria-label="فيسبوك">
                        <span className="ak-icon-circle ak-icon-small"><Icon name="facebook" size={17} color="#1C2B45" /></span>
                        <span>فيسبوك</span>
                    </a>
                </div>
                <p className="ak-legal">
                    <Link to="/confidentialite">سياسة الخصوصية</Link> · Angels Kids © {new Date().getFullYear()}
                </p>
            </footer>

            {/* Sticky order bar (hidden while the form is on screen) */}
            <div className={`ak-sticky${formOnScreen ? ' is-hidden' : ''}`} aria-hidden={formOnScreen}>
                <span className="ak-sticky-price">
                    {packPrice} دج
                    {quantity > 1 && <small> · {quantity} أطقم</small>}
                </span>
                <button type="button" className="ak-btn ak-btn-gold" onClick={scrollToForm} tabIndex={formOnScreen ? -1 : 0}>
                    اطلبي الآن
                </button>
            </div>
        </div>
    );
};

export default UniformeLanding;
