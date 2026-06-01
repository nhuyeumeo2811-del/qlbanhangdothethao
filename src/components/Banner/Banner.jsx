import React, { useState, useEffect } from 'react';
import './Banner.css';

import banner1 from '../../img/Banner1.ipg';
import banner2 from '../../img/Banner2.ipg';
import banner3 from '../../img/Banner3.ipg'
import banner4 from '../../img/Banner4.ipg'
import banner5 from '../../img/Banner5.ipg'
import banner6 from '../../img/Banner6.ipg'
import banner9 from '../../img/Banner9.ipg'
import banner9 from '../../img/Banner10.ipg'

const Banner = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const banners = [banner1, banner2, banner3, banner4, banner5, banner6, banner9];

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