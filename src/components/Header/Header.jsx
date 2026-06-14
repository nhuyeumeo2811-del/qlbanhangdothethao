import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import logoImg from '../../img/logo.png';
import { imageMap } from '../../utils/productImages';

const jsonBase = import.meta.env.BASE_URL || '/';

const customNormalizeText = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD') 
        .replace(/[\u0300-\u036f]/g, '') 
        .replace(/đ/g, 'd')
        .trim()
        .replace(/\s+/g, ' ');
};

const translations = {
    VN: {
        delivery: 'Giao hàng miễn phí',
        login: 'Quản trị viên',
        cart: 'Giỏ hàng',
        searchPlaceholder: 'Bạn muốn mua gì...',
        searchBtn: 'Tìm',
        noProduct: 'Không tìm thấy sản phẩm phù hợp. Thử từ khóa khác xem sao nhé!',
        home: 'TRANG CHỦ',
        coffee: 'TRANG PHỤC THỂ THAO',
        tea: 'MŨ NÓN',
        drinks: 'THỰC PHẨM BỔ SUNG',
        products: 'GIÀY THỂ THAO',
        promotions: 'KHUYẾN MÃI',
        about: 'VỀ CHÚNG TÔI',
        profile: 'HỒ SƠ',
        admin: 'Quản trị',
        logout: 'Đăng xuất',
        coffeeMenu: [
            { text: 'Áo thể thao', href: '/products?category=ao' },
            { text: 'Quần thể thao', href: '/products?category=quan' },
            { text: 'Bộ quần áo thể thao', href: '/products?category=bo-quan-ao' }
        ]
    },
    EN: {
        delivery: 'Free delivery',
        login: 'Admin',
        cart: 'Cart',
        searchPlaceholder: 'What do you want to buy...',
        searchBtn: 'Search',
        noProduct: 'No matching products found. Try another keyword!',
        home: 'HOME',
        coffee: 'SPORTSWEAR',
        tea: 'HATS & CAPS',
        drinks: 'SUPPLEMENTS',
        products: 'SNEAKERS',
        promotions: 'PROMOTIONS',
        about: 'ABOUT US',
        profile: 'PROFILE',
        admin: 'Admin panel',
        logout: 'Logout',
        coffeeMenu: [
            { text: 'Sport Shirts', href: '/products?category=ao' },
            { text: 'Sport Pants', href: '/products?category=quan' },
            { text: 'Sportswear Sets', href: '/products?category=bo-quan-ao' }
        ]
    }
};

const Header = () => {
    const [lang, setLang] = useState('VN');
    const [searchQuery, setSearchQuery] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        return localStorage.getItem('isLoggedIn') === 'true';
    });
    const [userRole, setUserRole] = useState(() => {
        return localStorage.getItem('userRole') || 'customer';
    });

    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [hoveredMenu, setHoveredMenu] = useState(null);
    const [cartCount, setCartCount] = useState(0);

    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const userMenuRef = useRef(null);

    const t = translations[lang];

    useEffect(() => {
        const updateCartCount = () => {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
            setCartCount(totalItems);
        };

        updateCartCount();
        window.addEventListener('storage', updateCartCount);
        window.addEventListener('cartUpdated', updateCartCount);

        return () => {
            window.removeEventListener('storage', updateCartCount);
            window.removeEventListener('cartUpdated', updateCartCount);
        };
    }, []);

    useEffect(() => {
        fetch(`${jsonBase}products.json`)
            .then((res) => {
                if (!res.ok) throw new Error('Không thể tải dữ liệu sản phẩm');
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) setAllProducts(data);
                else if (data && Array.isArray(data.products)) setAllProducts(data.products);
            })
            .catch((err) => console.error('Lỗi fetch products trong Header:', err));
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProducts([]);
            return;
        }

        const normalizedQuery = customNormalizeText(searchQuery);
        const tokens = normalizedQuery.split(' ').filter(t => t.length > 0);

        if (tokens.length === 0) {
            setFilteredProducts([]);
            return;
        }

        const matches = allProducts.filter((product) => {
            const nameNorm = customNormalizeText(product.name);
            const idNorm = customNormalizeText(product.id);
            const catNorm = customNormalizeText(product.category);

            return tokens.every(token => 
                nameNorm.includes(token) || 
                idNorm.includes(token) || 
                catNorm.includes(token)
            );
        });

        setFilteredProducts(matches.slice(0, 6));
    }, [searchQuery, allProducts]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
            setShowDropdown(false);
        }
    };

    const handleOptionClick = (productName) => {
        setSearchQuery(productName);
        setShowDropdown(false);
        navigate(`/products?search=${encodeURIComponent(productName)}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        setIsLoggedIn(false);
        setUserRole('customer');
        setIsUserMenuOpen(false);
        navigate('/');
    };

    const toggleLang = () => {
        setLang((prev) => (prev === 'VN' ? 'EN' : 'VN'));
    };

    return (
        <header className="phuclong-header">
            <div className="header-top-bar">
                <div className="header-top-content">
                    
                    <div className="header-logo-container">
                        <div className="phuclong-logo">
                            <button className="header-logo-btn" onClick={() => navigate('/')}>
                                <img src={logoImg} alt="LaLaShop Logo" className="header-logo-image" />
                            </button>
                        </div>
                    </div>

                    <div className="header-search-strip" ref={dropdownRef}>
                        <div className="header-search-strip__inner">
                            <form className="header-search__form" onSubmit={handleSearchSubmit}>
                                <i className="fas fa-search header-search__icon"></i>
                                <input
                                    type="text"
                                    className="header-search__input"
                                    placeholder={t.searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowDropdown(true);
                                    }}
                                    onFocus={() => setShowDropdown(true)}
                                />
                                <button type="submit" className="header-search__submit">
                                    {t.searchBtn}
                                </button>
                            </form>

                            {showDropdown && searchQuery.trim() && (
                                <ul className="header-search__dropdown">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((product) => {
                                            const finalImgSrc = imageMap[product.image] || product.image;
                                            return (
                                                <li key={product.id}>
                                                    <button
                                                        type="button"
                                                        className="header-search__option"
                                                        onClick={() => handleOptionClick(product.name)}
                                                    >
                                                        <div className="header-search__thumb-wrap">
                                                            <img
                                                                src={finalImgSrc}
                                                                alt={product.name}
                                                                className="header-search__thumb"
                                                            />
                                                        </div>
                                                        <div className="header-search__meta">
                                                            <span className="header-search__name">{product.name}</span>
                                                            <span className="header-search__price">
                                                                {Number(product.price).toLocaleString('vi-VN')} đ
                                                            </span>
                                                        </div>
                                                    </button>
                                                </li>
                                            );
                                        })
                                    ) : (
                                        <div className="header-search__empty">{t.noProduct}</div>
                                    )}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="header-delivery-info">
                        <i className="fas fa-phone delivery-icon"></i>
                        <span className="delivery-phone">1800 6779</span>
                    </div>

                    <div className="header-user-actions">
                        {currentUser ? (
                            <div
                                className="header-user-menu"
                                ref={userMenuRef}
                            >
                                <button
                                    type="button"
                                    className="login-link header-user-menu-trigger"
                                    aria-expanded={userMenuOpen}
                                    aria-haspopup="true"
                                    onClick={() =>
                                        setUserMenuOpen((o) => !o)
                                    }
                                >
                                    {userLabel}

                                    <i
                                        className={`fas fa-chevron-down header-user-menu-caret ${userMenuOpen ? 'is-open' : ''
                                            }`}
                                        aria-hidden="true"
                                    />
                                </button>

                                {userMenuOpen && (
                                    <div
                                        className="header-user-dropdown"
                                        role="menu"
                                    >
                                        <button
                                            type="button"
                                            className="header-user-dropdown-item"
                                            role="menuitem"
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                navigate('/profile');
                                            }}
                                        >
                                            HỒ SƠ
                                        </button>

                                        {currentUser.role === 'staff' && (
                                            <button
                                                type="button"
                                                className="header-user-dropdown-item"
                                                role="menuitem"
                                                onClick={() => {
                                                    setUserMenuOpen(false);
                                                    navigate('/admin');
                                                }}
                                            >
                                                Quản trị
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="header-user-dropdown-item header-user-dropdown-item--logout"
                                            role="menuitem"
                                            onClick={handleLogout}
                                        >
                                            Đăng xuất
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button
                                type="button"
                                className="login-link"
                                onClick={() => navigate('/login')}
                            >
                                Đăng nhập
                            </button>
                        )}

                        <span className="action-separator">|</span>

                        <div className="language-selector">
                            <span className="lang-active">VN</span>

                            <span className="lang-separator">|</span>

                            <span className="lang-option">EN</span>
                        </div>

                        <button
                            className="cart-button"
                            onClick={() => navigate('/cart')}
                        >
                            <i className="fas fa-shopping-cart"></i>

                            <span>Giỏ hàng</span>

                            <span className="cart-badge">
                                {cartCount}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
            <nav className="header-navigation">
                <div className="nav-content">
                    <a href="/" className="nav-link">
                        {t.home}
                    </a>

                    <div
                        className="nav-item-with-dropdown"
                        onMouseEnter={() => setHoveredMenu('coffee')}
                        onMouseLeave={() => setHoveredMenu(null)}
                    >
                        <a
                            href="/products"
                            className={`nav-link ${
                                window.location.pathname.includes('/products') ? 'active' : ''
                            }`}
                        >
                            {t.coffee}
                        </a>

                        {hoveredMenu === 'coffee' && (
                            <div className="dropdown-menu">
                                {t.coffeeMenu.map((item, index) => (
                                    <a
                                        key={index}
                                        href={item.href}
                                        className="dropdown-item"
                                    >
                                        {item.text}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    <a href="/tea" className="nav-link">
                        {t.tea}
                    </a>

                    <a href="/drinks" className="nav-link">
                        {t.drinks}
                    </a>

                    <a href="/products" className="nav-link">
                        {t.products}
                    </a>

                    <a href="/promotions" className="nav-link">
                        {t.promotions}
                    </a>

                    <a href="/about" className="nav-link">
                        {t.about}
                    </a>
                </div>
            </nav>
        </header>
    );
};

export default Header;
