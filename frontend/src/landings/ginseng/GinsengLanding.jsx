import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { cldSrcSet, cldUrl } from '../../lib/cloudinary';
import { trackEvent } from '../../utils/FacebookPixel';
import { offerPrice, offerSaving } from '../offers';
import GinsengOrderForm from './GinsengOrderForm';
import { content, images, FACEBOOK_PAGE, SHOP_PHONE } from './content';
import './ginseng.css';

// Keep in sync with the hero preload in index.html
const HERO_SIZES = '(min-width: 900px) 420px, 92vw';

const scrollGently = (element, block = 'start') => {
    if (!element) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block });
};

const svg = (children, size = 24) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const Icon = {
    shield: (size) => svg(<><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /><path d="M9 12l2 2 4-4" /></>, size),
    qr: (size) => svg(<><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><path d="M14 14h2v2h-2zM18 14h2v2M14 18h2v2M18 18h2v2" /></>, size),
    box: (size) => svg(<><path d="M4 8l8-4 8 4v8l-8 4-8-4V8z" /><path d="M4 8l8 4 8-4M12 12v8" /></>, size),
    capsule: (size) => svg(<><rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-35 12 12)" /><path d="M9.6 7.6l4.8 6.8" /></>, size),
    moon: (size) => svg(<path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />, size),
    glass: (size) => svg(<><path d="M7 4h10l-1.2 15a2 2 0 01-2 1.8h-3.6a2 2 0 01-2-1.8L7 4z" /><path d="M7.4 10h9.2" /></>, size),
    cash: (size) => svg(<><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>, size),
    truck: (size) => svg(<><path d="M3 7h11v9H3z" /><path d="M14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.8" /><circle cx="17" cy="18" r="1.8" /></>, size),
    warn: (size) => svg(<><path d="M12 4.5l8.5 15h-17l8.5-15z" /><path d="M12 10v4M12 17h.01" /></>, size),
    tick: (size) => svg(<path d="M5 12.5l4.5 4.5L19 7.5" strokeWidth="2.6" />, size),
};

// The one thing a customer buys here is a sealed box: one color, one size, nothing to choose.
const singlePiece = (product) => {
    const color = (product.colors || [])[0] || null;
    return { color, size: (color?.sizes || [])[0] || null };
};

// "GINSENG KIANPI PIL" landing page (design: Bellevia DZ — صفحة الهبوط)
const GinsengLanding = ({ slug, product }) => {
    // One entry per box of the chosen pack; the shared checkout counts the pieces from it
    const [items, setItems] = useState(() => Array.from({ length: content.defaultPack }, () => singlePiece(product)));
    const addToCartSent = useRef(false);
    const formRef = useRef(null);
    const offersRef = useRef(null);

    const quantity = items.length;
    const packPrice = offerPrice(product, quantity);

    // The customer choosing a pack herself is the "add to cart" moment
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

    const choosePack = useCallback((count) => {
        setItems(Array.from({ length: count }, () => singlePiece(product)));
        sendAddToCart(count);
    }, [product, sendAddToCart]);

    const scrollToForm = () => scrollGently(formRef.current);
    const scrollToVerify = () => scrollGently(document.getElementById('gs-verify'));

    // Takes the hero straight to the offers with the 2-box pack already chosen
    const goToOffers = () => {
        choosePack(2);
        scrollGently(offersRef.current, 'center');
    };

    // The cheaper-per-box line in the hero, only while that offer is really cheaper
    const twoPackPrice = offerPrice(product, 2);
    const packHint = twoPackPrice < product.price * 2
        ? { price: twoPackPrice, perBox: Math.round(twoPackPrice / 2) }
        : null;

    useEffect(() => {
        document.title = `${content.pageTitle} — ${content.brand}`;
    }, []);

    // The design is set in Cairo; loaded after the first paint so it never blocks the page
    useEffect(() => {
        const href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap';
        if (document.querySelector(`link[href="${href}"]`)) return undefined;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
        return () => link.remove();
    }, []);

    return (
        <div className="gs-page" dir="rtl">
            <header className="gs-header">
                <div className="gs-wrap">
                    <span className="gs-header-name">{content.productName}</span>
                    <button type="button" className="gs-header-link" onClick={scrollToVerify}>
                        {Icon.qr(18)}
                        <span>{content.ctaVerify}</span>
                    </button>
                </div>
            </header>

            {/* Hero */}
            <section className="gs-hero">
                <div className="gs-wrap">
                    <div className="gs-hero-photo">
                        {/* The sticker is the page's whole argument, so the photo points at it */}
                        <div className="gs-hero-frame">
                            <img
                                src={cldUrl(images.hero, 640)}
                                srcSet={cldSrcSet(images.hero)}
                                sizes={HERO_SIZES}
                                alt={`${content.productName} — القارورة والعلبة مع ملصق التحقق`}
                                fetchPriority="high"
                                decoding="async"
                                width="1072"
                                height="1456"
                            />
                            <span className="gs-qr-ring" aria-hidden="true" />
                            <span className="gs-qr-pill" aria-hidden="true">{Icon.qr(14)}{content.qrCallout}</span>
                        </div>
                    </div>

                    <div className="gs-hero-text">
                        <span className="gs-kicker">{content.productName}</span>
                        <h1>{content.title}</h1>
                        <p className="gs-lead">{content.subtitle}</p>

                        <div className="gs-price-box">
                            <p className="gs-price">
                                <span>{content.priceFrom}</span>
                                <b>{product.price} دج</b>
                                <span>· {content.priceNote}</span>
                            </p>
                            {packHint && (
                                <button type="button" className="gs-price-more" onClick={goToOffers}>
                                    {content.packHint(packHint.price, packHint.perBox)}
                                </button>
                            )}
                        </div>

                        <div className="gs-hero-actions">
                            <button type="button" className="gs-btn gs-btn-green" onClick={scrollToForm}>{content.cta}</button>
                            <button type="button" className="gs-btn gs-btn-outline" onClick={scrollToVerify}>
                                {Icon.shield(20)}<span>{content.ctaVerify}</span>
                            </button>
                        </div>

                        <ul className="gs-facts">
                            {content.heroFacts.map((fact) => (
                                <li key={fact.text}>{Icon[fact.icon](18)}<span>{fact.text}</span></li>
                            ))}
                        </ul>

                        <p className="gs-hero-note">{content.intro}</p>
                    </div>
                </div>
            </section>

            {/* How it is used, as printed on the box */}
            <section className="gs-section gs-section-white">
                <div className="gs-wrap">
                    <div className="gs-head">
                        <span className="gs-eyebrow">{content.usageEyebrow}</span>
                        <h2>{content.usageTitle}</h2>
                    </div>
                    <div className="gs-steps">
                        {content.usage.map((step, index) => (
                            <div key={step.text} className="gs-step">
                                <span className="gs-step-icon">{Icon[step.icon](32)}</span>
                                <span className="gs-step-no">{String(index + 1).padStart(2, '0')}</span>
                                <b>{step.text}</b>
                            </div>
                        ))}
                    </div>
                    <p className="gs-lead">{content.usageNote}</p>
                    <p className="gs-bar">{Icon.box(26)}{content.usageBar}</p>

                    <div className="gs-safety">
                        <h3>{Icon.warn(22)}{content.safetyTitle}</h3>
                        <ul>
                            {content.safety.map((line) => <li key={line}>{line}</li>)}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Authenticity */}
            <section id="gs-verify" className="gs-verify">
                <div className="gs-wrap">
                    <div className="gs-head">
                        <span className="gs-eyebrow">{content.verifyEyebrow}</span>
                        <h2>{content.verifyTitle}</h2>
                        <p className="gs-verify-lead">{content.verifyLead}</p>
                    </div>

                    <ul className="gs-verify-steps">
                        {content.verifySteps.map((step, index) => (
                            <li key={step}><b>{String(index + 1).padStart(2, '0')}</b><span>{step}</span></li>
                        ))}
                    </ul>

                    <div className="gs-verify-photos">
                        <figure className="gs-verify-sticker">
                            <img
                                src={cldUrl(images.sticker, 640)}
                                srcSet={cldSrcSet(images.sticker, [320, 480, 640])}
                                sizes="(min-width: 900px) 420px, 92vw"
                                alt="ملصق الأمان مع رمز QR والرقم التسلسلي"
                                loading="lazy"
                                decoding="async"
                            />
                            <figcaption>{content.verifyStickerCaption}</figcaption>
                        </figure>

                        <figure className="gs-verify-phone">
                            <span className="gs-phone-frame">
                                <img
                                    src={cldUrl(images.verifyScreen, 480)}
                                    srcSet={cldSrcSet(images.verifyScreen, [320, 480])}
                                    sizes="232px"
                                    alt="صفحة التحقق تاع WISDOM بعد مسح رمز QR"
                                    loading="lazy"
                                    decoding="async"
                                />
                            </span>
                            <figcaption>{content.verifyScreenCaption}</figcaption>
                        </figure>
                    </div>

                    <p className="gs-verify-note">{content.verifyHonest}</p>

                    {content.verifyUrl && (
                        <a className="gs-btn gs-btn-gold" href={content.verifyUrl} target="_blank" rel="noreferrer noopener">
                            {Icon.shield(22)}<span>افتح صفحة التحقق</span>
                        </a>
                    )}
                </div>
            </section>

            {/* Real photos */}
            <section className="gs-section">
                <div className="gs-wrap">
                    <div className="gs-head">
                        <span className="gs-eyebrow">{content.detailsEyebrow}</span>
                        <h2>{content.detailsTitle}</h2>
                    </div>
                    <div className="gs-photos">
                        {content.detailsPhotos.map((item) => (
                            <figure key={item.key}>
                                <img
                                    src={cldUrl(images[item.key], 480)}
                                    srcSet={cldSrcSet(images[item.key], [320, 480, 640])}
                                    sizes="(min-width: 900px) 420px, 92vw"
                                    alt={item.caption}
                                    loading="lazy"
                                    decoding="async"
                                />
                                <figcaption>{item.caption}</figcaption>
                            </figure>
                        ))}
                    </div>
                </div>
            </section>

            {/* Offers */}
            <section ref={offersRef} className="gs-section gs-section-sage">
                <div className="gs-wrap">
                    <div className="gs-head">
                        <span className="gs-eyebrow">{content.offersEyebrow}</span>
                        <h2>{content.offersTitle}</h2>
                    </div>
                    <div className="gs-offers" role="group" aria-label={content.offersTitle}>
                        {content.packs.map((pack) => {
                            const price = offerPrice(product, pack.quantity);
                            const saving = offerSaving(product, pack.quantity);
                            const selected = pack.quantity === quantity;
                            const perBox = Math.round(price / pack.quantity);
                            const className = ['gs-offer', selected && 'is-selected', pack.best && 'is-best', pack.highlight && 'is-popular']
                                .filter(Boolean).join(' ');
                            return (
                                <button
                                    key={pack.quantity}
                                    type="button"
                                    className={className}
                                    aria-pressed={selected}
                                    onClick={() => { choosePack(pack.quantity); scrollToForm(); }}
                                >
                                    <span className="gs-offer-tag">{pack.tag}</span>

                                    <span className="gs-offer-head">
                                        {/* One bottle per box, so the size of the pack is readable before the price */}
                                        <span className="gs-offer-thumbs" aria-hidden="true">
                                            {Array.from({ length: pack.quantity }, (unused, index) => (
                                                <img key={index} src={cldUrl(images.hero, 96)} alt="" loading="lazy" decoding="async" />
                                            ))}
                                        </span>
                                        <span className="gs-offer-name">{pack.label}</span>
                                    </span>

                                    <span className="gs-offer-prices">
                                        <b className="gs-offer-price">{price} دج</b>
                                        {saving > 0 && <s className="gs-offer-was">{product.price * pack.quantity} دج</s>}
                                    </span>

                                    <span className="gs-offer-per">
                                        {content.perBoxLabel} <b>{perBox} دج</b>
                                        {saving > 0 && <i>{content.perBoxInsteadOf} {product.price} دج</i>}
                                    </span>

                                    {saving > 0 && <span className="gs-offer-save">وفّر {saving} دج</span>}

                                    <span className="gs-offer-pick">
                                        {selected && Icon.tick(18)}
                                        {selected ? content.chosenLabel : content.chooseLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="gs-muted">{content.offersNote}</p>
                </div>
            </section>

            {/* Order form */}
            <section id="order" ref={formRef} className="gs-section gs-order">
                <div className="gs-wrap">
                    <div className="gs-head">
                        <span className="gs-eyebrow">{content.formEyebrow}</span>
                        <h2>{content.formTitle}</h2>
                        <p className="gs-muted">{content.formSubtitle}</p>
                    </div>
                    <GinsengOrderForm
                        slug={slug}
                        product={product}
                        items={items}
                        packPrice={packPrice}
                        onPack={choosePack}
                    />
                </div>
            </section>

            {/* FAQ */}
            <section className="gs-section gs-section-white">
                <div className="gs-wrap">
                    <h2>{content.faqTitle}</h2>
                    <div className="gs-faq">
                        {content.faq.map((entry) => (
                            <details key={entry.q}>
                                <summary>
                                    <span>{entry.q}</span>
                                    <span className="gs-faq-sign" aria-hidden="true">+</span>
                                </summary>
                                <p>{entry.a}</p>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="gs-final">
                <div className="gs-wrap">
                    <h2>{content.finalTitle}</h2>
                    <p>{content.finalText}</p>
                    <div className="gs-final-actions">
                        <button type="button" className="gs-btn gs-btn-gold" onClick={scrollToForm}>{content.cta}</button>
                        <button type="button" className="gs-btn gs-btn-outline" onClick={scrollToVerify}>{content.ctaVerify}</button>
                    </div>
                </div>
            </section>

            <footer className="gs-footer">
                <div className="gs-wrap">
                    <span className="gs-footer-name">{content.brand}</span>
                    <p className="gs-muted">{content.tagline}</p>
                    <p className="gs-footer-links">
                        <a href={`tel:${SHOP_PHONE}`} dir="ltr">{SHOP_PHONE}</a>
                        {' · '}
                        <a href={FACEBOOK_PAGE}>فيسبوك</a>
                        {' · '}
                        <Link to="/confidentialite">سياسة الخصوصية</Link>
                    </p>
                    <p className="gs-copy">© {content.brand} {new Date().getFullYear()}</p>
                </div>
            </footer>

            {/* Sticky order bar */}
            <div className="gs-sticky">
                <div className="gs-wrap">
                    <span className="gs-sticky-price">
                        <span>{content.priceFrom}</span>
                        <b>{product.price} دج</b>
                    </span>
                    <button type="button" className="gs-btn gs-btn-green" onClick={scrollToForm}>{content.cta}</button>
                </div>
            </div>
        </div>
    );
};

export default GinsengLanding;
