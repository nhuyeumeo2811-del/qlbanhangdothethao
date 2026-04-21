import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import logoImage from '../../img/logo.png';

const Header = () => {
    const [cartCount, setCartCount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const updateCart = () => {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                const cart = JSON.parse(savedCart);
                setCartCount(cart.reduce((sum, item) => sum + (item.quantity || 0), 0));
            }
        };
        updateCart();
        window.addEventListener('cartUpdated', updateCart);
        window.addEventListener('storage', updateCart);
        return () => {
            window.removeEventListener('cartUpdated', updateCart);
            window.removeEventListener('storage', updateCart);
        };
    }, []);

    return (
        <header className="lalashop-header">
            <div className="header-top-row">
                <div className="header-container">
                    
                    <div className="header-logo" onClick={() => navigate('/')}>
                        <img src={logoImage} alt="LalaShop Logo" />
                    </div>

                    <div className="header-search-center">
                        <div className="search-input-group">
                            <i className="fas fa-search search-icon"></i>  
                            <input type="text" placeholder="search" />
                        </div>
                    </div>

                    

                    <div className="header-icons-right">
                        <div className="header-info-block">
                            <i className="fas fa-envelope"></i>
                            <span>Liên Hệ</span>
                        </div>
                        <div className="header-info-block">
                            <i className="fas fa-phone-alt"></i>
                            <span>0929089543</span>
                        </div>
                        <div className="header-info-block cart-icon" onClick={() => navigate('/cart')}>
                            <i className="fas fa-shopping-cart"></i>
                            <span>Giỏ Hàng</span>
                            {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
                        </div>
                        <div className="header-user-avatar" onClick={() => navigate('/login')}>
                            <i className="fas fa-user-circle"></i>
                        </div>
                    </div>
                    
                </div>
            </div>
            
            <nav className="header-bottom-nav">
                <div className="nav-container">
                    <a href="/quan-ao">Quần áo</a>
                    <a href="/giay">Giày thể thao</a>
                    <a href="/do-bo-co">Đồ bó cơ</a>
                    <a href="/tui-xach">Túi xách & Balo</a>
                    <a href="/phu-kien">Phụ kiện tay chân</a>
                    <a href="/bao-ho">Đồ bảo hộ chấn thương</a>
                    <a href="/kinh-mat">Kính mắt thể thao</a>
                    <a href="/thiet-bi">Thiết bị đeo thông minh</a>
                </div>
            </nav>
        </header>
    );
};

export default Header;