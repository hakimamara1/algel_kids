import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

// Optimized Image Component
const CloudinaryImage = ({ url, width, alt }) => {
    // Simple transformation application
    // Appends f_auto,q_auto and width to the URL if it's a cloudinary URL
    // This is a basic implementation. In prod, use cloudinary-react SDK or robust regex.
    let src = url;
    if (url.includes('cloudinary.com')) {
        const parts = url.split('/upload/');
        if (parts.length === 2) {
            src = `${parts[0]}/upload/f_auto,q_auto,w_${width}/${parts[1]}`;
        }
    }

    return (
        <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            loading="lazy"
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
            >
                {images.map((img, index) => (
                    <SwiperSlide key={img.publicId || index}>
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <CloudinaryImage
                                url={img.url}
                                width={800}
                                alt={`Product View ${index + 1}`}
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

export default ImageCarousel;
