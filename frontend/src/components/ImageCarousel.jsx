import React, { useEffect, useRef, useState } from 'react';
import { cldUrl, cldSrcSet, GALLERY_SIZES } from '../lib/cloudinary';

const FALLBACK_IMAGE = 'https://placehold.co/800x600?text=Image+Not+Found';

// Swipeable gallery built on CSS scroll-snap (replaces Swiper).
// dir="ltr" keeps the scroll math simple inside the RTL page.
const ImageCarousel = ({ images, alt = '' }) => {
    const trackRef = useRef(null);
    const [index, setIndex] = useState(0);
    const firstUrl = images[0]?.url;

    // Back to the first photo when the photo set changes (another color was selected)
    useEffect(() => {
        trackRef.current?.scrollTo({ left: 0 });
    }, [firstUrl]);

    const handleScroll = () => {
        const track = trackRef.current;
        if (!track || !track.clientWidth) return;
        setIndex(Math.round(track.scrollLeft / track.clientWidth));
    };

    const goTo = (target) => {
        const track = trackRef.current;
        if (!track) return;
        const next = Math.max(0, Math.min(images.length - 1, target));
        track.scrollTo({ left: next * track.clientWidth, behavior: 'smooth' });
    };

    const hasMany = images.length > 1;

    return (
        <div className="relative w-full aspect-[3/4] md:aspect-auto md:h-[600px] bg-gray-100" dir="ltr">
            <div
                ref={trackRef}
                onScroll={handleScroll}
                className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                aria-roledescription="carousel"
                aria-label={alt}
            >
                {images.map((img, i) => (
                    <div
                        key={img.publicId || i}
                        className="w-full h-full flex-none snap-start snap-always"
                        aria-roledescription="slide"
                        aria-label={`${i + 1} / ${images.length}`}
                    >
                        <img
                            src={cldUrl(img.url, 828)}
                            srcSet={cldSrcSet(img.url)}
                            sizes={GALLERY_SIZES}
                            alt={`${alt} ${i + 1}`}
                            className="w-full h-full object-cover"
                            loading={i === 0 ? 'eager' : 'lazy'}
                            fetchPriority={i === 0 ? 'high' : 'auto'}
                            decoding="async"
                            draggable={false}
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.removeAttribute('srcset');
                                e.currentTarget.src = FALLBACK_IMAGE;
                            }}
                        />
                    </div>
                ))}
            </div>

            {hasMany && (
                <>
                    <button
                        type="button"
                        onClick={() => goTo(index - 1)}
                        disabled={index === 0}
                        aria-label="الصورة السابقة"
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-gray-800 shadow flex items-center justify-center transition-opacity disabled:opacity-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button
                        type="button"
                        onClick={() => goTo(index + 1)}
                        disabled={index === images.length - 1}
                        aria-label="الصورة التالية"
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/80 text-gray-800 shadow flex items-center justify-center transition-opacity disabled:opacity-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        {images.map((img, i) => (
                            <button
                                key={img.publicId || i}
                                type="button"
                                onClick={() => goTo(i)}
                                aria-label={`الصورة ${i + 1}`}
                                aria-current={i === index}
                                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-pink-500' : 'w-2 bg-white/80'}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default ImageCarousel;
