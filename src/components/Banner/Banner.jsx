import React, { useState, useEffect } from 'react';
import './Banner.css';

import banner1 from '../../img/Banner1.jpg';
import banner2 from '../../img/Banner2.jpg';
import banner3 from '../../img/Banner3.jpg';
import banner4 from '../../img/Banner4.jpg';
import banner5 from '../../img/Banner5.jpg';
import banner6 from '../../img/Banner6.jpg';
import banner9 from '../../img/Banner9.jpg';
import banner9 from '../../img/Banner10.jpg';

const Banner = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const banners = [banner1, banner2, banner3, banner4, banner5, banner6, banner7, banner8, banner9, banner10];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
        }, 10000); 
        return () => clearInterval(interval);
    }, [banners.length]);

    return (
        <div className="banner-carousel">
            <div className="banner-wrapper">
                {banners.map((banner, index) => (
                    <div
                        key={index}
                        className={`banner-slide ${index === currentIndex ? 'active' : ''}`}
                    >
                        <img
                            src={banner}
                            alt={`Banner ${index + 1}`}
                            className="banner-image"
                        />
                    </div>
                ))}
            </div>

            <div className="banner-dots">
                {banners.map((_, index) => (
                    <span
                        key={index}
                        className={`dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    ></span>
                ))}
            </div>
        </div>
    );
};

export default Banner;