import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Optimized Image Component with WebP support
const CloudinaryImage = ({ url, width, alt, priority = false }) => {
    // Enhanced transformation with WebP format and quality optimization
    // Appends f_auto (WebP + fallback), q_auto, and width to Cloudinary URLs
    let src = url;
    if (url.includes('cloudinary.com')) {
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            // f_auto enables WebP with fallback, q_auto optimizes quality, w_ sets width
            src = `${parts[0]}/upload/f_auto,q_auto:good,w_${width},c_limit/${parts[1]}`;
        }
    }

    return (
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/800x600?text=Image+Not+Found';
            }}
        />
    );
};

const ImageCarousel = ({ images }) => {
    return (
        <div className="w-full h-[450px] md:h-[600px]">
            <Swiper
                modules={[Navigation, Pagination]}
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{
                    clickable: true,
                    bulletActiveClass: 'swiper-pagination-bullet-active bg-pink-500',
                }}
                className="h-full w-full"
                lazy={{
                    loadPrevNext: true,
                }}
            >
                {images.map((img, index) => (
                    <SwiperSlide key={img.publicId || index}>
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <CloudinaryImage
                                url={img.url}
                                width={800}
                                alt={`Product View ${index + 1}`}
                                priority={index === 0}
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default ImageCarousel;
