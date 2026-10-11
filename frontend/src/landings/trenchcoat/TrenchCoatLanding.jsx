import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cldSrcSet, cldUrl } from '../../lib/cloudinary';
import { defaultColor, pickSize } from '../../lib/variants';
import { trackEvent } from '../../utils/FacebookPixel';
import { offerPrice, offerSaving } from '../offers';
import TrenchCoatOrderForm from './TrenchCoatOrderForm';
import { content, images, FACEBOOK_PAGE, SHOP_PHONE } from './content';
import './trenchcoat.css';

// Keep in sync with the hero preload in index.html
const HERO_SIZES = '(min-width: 900px) 420px, 92vw';

const scrollGently = (element, block = 'start') => {
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block });
};

const colorLabel = (color) => content.colorLabels[color?.name] || color?.name || '';

const TruckIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
        <path d="M2.6 6.6h10.4v9H2.6z" /><path d="M13 9.6h3.8l2.7 3v3H13z" />
        <circle cx="7" cy="17.6" r="1.8" /><circle cx="16.4" cy="17.6" r="1.8" />
    </svg>
);

// "بلوزة Plissé" landing page (design: Angels closet — صفحة الهبوط, board V1)
const TrenchCoatLanding = ({ slug, product }) => {
    // One entry per piece of the chosen pack, each with its own color and size
    const [items, setItems] = useState(() => {
        // The color of the hero photo comes first, as long as it is in stock
        const wanted = (product.colors || []).find((color) => color.name === content.defaultColorName);
        const color = (wanted && pickSize(wanted) ? wanted : defaultColor(product.colors));
        return Array.from({ length: content.defaultPack }, () => ({ color, size: pickSize(color) }));
    });
    const addToCartSent = useRef(false);
    const formRef = useRef(null);

    const quantity = items.length;
    const packPrice = offerPrice(product, quantity);
    const heroColor = items[0]?.color;

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
            ? [...prev, ...Array.from({ length: count - prev.length }, () => prev[prev.length - 1])]
            : prev.slice(0, count)));
        sendAddToCart(count);
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

    const scrollToForm = () => scrollGently(formRef.current);

    // The colors for sale, then the ones that are finished (shown, never orderable)
    const sortedColors = [...(product.colors || [])].sort(
        (a, b) => content.colorOrder.indexOf(a.name) - content.colorOrder.indexOf(b.name),
    );
    const colorCards = [
        ...sortedColors.map((color) => ({
            key: color.name,
            label: colorLabel(color),
            image: content.colorPhotos[color.name] || color.images?.[0]?.url,
            soldOut: (color.sizes || []).every((size) => Number(size.stock) <= 0),
        })),
        ...content.soldOutColors.map((color) => ({ key: color.label, label: color.label, image: color.image, soldOut: true })),
    ];

    useEffect(() => {
        document.title = `${content.pageTitle} — ${content.brand}`;
    }, []);

    return (
        <div className="tc-page" dir="rtl">
            {/* Hero */}
            <header className="tc-hero">
                <img className="tc-logo" src={cldUrl(images.logo, 480)} width="200" height="125" alt={content.brand} />
                <h1>{content.title}</h1>
                <p className="tc-subtitle">{content.subtitle}</p>
                <img
                    className="tc-hero-photo"
                    src={cldUrl(images.hero, 640)}
                    srcSet={cldSrcSet(images.hero)}
                    sizes={HERO_SIZES}
                    alt={`${product.title} — ${colorLabel(heroColor)}`}
                    fetchPriority="high"
                    decoding="async"
                />
                <span className="tc-price">{product.price} دج</span>
                <span className="tc-price-note">{content.priceNote}</span>
                <button type="button" className="tc-btn tc-btn-accent" onClick={scrollToForm}>{content.cta}</button>
                <p className="tc-note"><TruckIcon /> {content.deliveryNote}</p>
            </header>

            {/* Colors */}
            <section className="tc-section tc-on-tint" aria-labelledby="tc-colors-title">
                <h2 id="tc-colors-title">{content.colorsTitle}</h2>
                <div className="tc-colors">
                    {colorCards.map((card) => (
                        <figure key={card.key} className={`tc-color-card${card.soldOut ? ' is-out' : ''}`}>
                            {card.image && (
                                <img
                                    src={cldUrl(card.image, 480)}
                                    srcSet={cldSrcSet(card.image, [320, 480, 640])}
                                    sizes="(min-width: 900px) 240px, 45vw"
                                    alt={`${product.title} — ${card.label}`}
                                    loading="lazy"
                                    decoding="async"
                                />
                            )}
                            <figcaption>
                                <span className="tc-color-name">{card.label}</span>
                                <span className={`tc-tag${card.soldOut ? ' is-out' : ''}`}>
                                    {card.soldOut ? content.soldOutLabel : content.inStockLabel}
                                </span>
                            </figcaption>
                        </figure>
                    ))}
                </div>
            </section>

            {/* Sizes */}
            <section className="tc-section" aria-labelledby="tc-sizes-title">
                <h2 id="tc-sizes-title">{content.sizesTitle}</h2>
                <ul className="tc-sizes">
                    <li>{content.sizeStandard}</li>
                </ul>
                <p className="tc-muted">{content.sizesNote}</p>
            </section>

            {/* Offers */}
            <section className="tc-section" aria-labelledby="tc-offers-title">
                <h2 id="tc-offers-title">{content.offersTitle}</h2>
                <div className="tc-offers">
                    {content.packs.map((pack) => {
                        const price = offerPrice(product, pack.quantity);
                        const saving = offerSaving(product, pack.quantity);
                        const selected = pack.quantity === quantity;
                        return (
                            <button
                                key={pack.quantity}
                                type="button"
                                className={`tc-offer${selected ? ' is-selected' : ''}`}
                                aria-pressed={selected}
                                onClick={() => choosePack(pack.quantity)}
                            >
                                <span className="tc-offer-name">{pack.label}</span>
                                <span className="tc-offer-price">{price} دج</span>
                                {saving > 0 && <span className="tc-offer-save">وفّري {saving} دج مقارنة بالشراء المنفصل</span>}
                            </button>
                        );
                    })}
                </div>
                <button type="button" className="tc-btn tc-btn-accent" onClick={scrollToForm}>{content.offersCta}</button>
            </section>

            {/* Gallery */}
            <section className="tc-section tc-section-wide tc-on-tint" aria-labelledby="tc-gallery-title">
                <h2 id="tc-gallery-title">{content.galleryTitle}</h2>
                <img
                    className="tc-chart"
                    src={cldUrl(images.chart, 828)}
                    srcSet={cldSrcSet(images.chart, [480, 640, 828])}
                    sizes="(min-width: 900px) 760px, 92vw"
                    alt="الألوان الثمانية للمعطف جنبًا إلى جنب"
                    loading="lazy"
                    decoding="async"
                />
            </section>

            {/* Order form */}
            <section id="order" ref={formRef} className="tc-order" aria-labelledby="tc-form-title">
                <h2 id="tc-form-title">{content.formTitle}</h2>
                <p className="tc-muted">{content.formSubtitle}</p>
                <TrenchCoatOrderForm
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

            {/* FAQ */}
            <section className="tc-section" aria-labelledby="tc-faq-title">
                <h2 id="tc-faq-title">{content.faqTitle}</h2>
                <div className="tc-faq">
                    {content.faq.map((entry) => (
                        <details key={entry.q}>
                            <summary>
                                <span>{entry.q}</span>
                                <span className="tc-faq-sign" aria-hidden="true">+</span>
                            </summary>
                            <p>{entry.a}</p>
                        </details>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="tc-footer">
                <img src={cldUrl(images.logo, 320)} width="140" height="88" alt={content.brand} loading="lazy" />
                <p>{content.tagline}</p>
                <p className="tc-footer-links">
                    <a href={`tel:${SHOP_PHONE}`} dir="ltr">{SHOP_PHONE}</a>
                    {' · '}
                    <a href={FACEBOOK_PAGE}>فيسبوك</a>
                    {' · '}
                    <Link to="/confidentialite">سياسة الخصوصية</Link>
                </p>
                <p className="tc-copy">© {content.brand} {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
};

export default TrenchCoatLanding;
