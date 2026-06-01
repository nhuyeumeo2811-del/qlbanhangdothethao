import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';
import logoImg from '../../img/logo.png';
import { imageMap } from '../../utils/productImages';

const jsonBase = import.meta.env.BASE_URL || '/';

// Hàm chuẩn hóa chuỗi: Chuyển thành chữ thường, xóa dấu tiếng Việt, xóa khoảng trắng thừa
const customNormalizeText = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD') // Tách các dấu ra khỏi chữ cái gốc
        .replace(/[\u0300-\u036f]/g, '') // Xóa các ký tự dấu
        .replace(/đ/g, 'd') // Sửa riêng chữ đ
        .trim()
        .replace(/\s+/g, ' '); // Gộp nhiều khoảng trắng thừa thành 1 khoảng trắng đơn
};

// Bộ từ điển dịch thuật để chuyển đổi ngôn ngữ VN <-> EN
const translations = {
    VN: {
        delivery: 'Giao hàng miễn phí',
        login: 'Đăng nhập',
        cart: 'Giỏ hàng',
        searchPlaceholder: 'Bạn muốn mua gì...',
        searchBtn: 'Tìm',
        noProduct: 'Không tìm thấy sản phẩm phù hợp. Thử từ khóa khác xem sao nhé!',
        home: 'TRANG CHỦ',
        coffee: 'TRANG PHỤC THỂ THAO',
        products: 'GIÀY THỂ THAO',
        tea: 'MŨ NÓN',
        drinks: 'THỰC PHẨM BỖ XUNG',
        promotions: 'KHUYẾN MÃI',
        about: 'VỀ CHÚNG TÔI',
        profile: 'HỒ SƠ',
        admin: 'Quản trị',
        logout: 'Đăng xuất',
        coffeeMenu: [
            { text: 'Thời Trang Nữ', href: '/lalashop/thoi-trang-nu' },
            { text: 'Thời Trang Nam', href: '/lalashop/thoi-trang-nam' },
        ]
    },
    EN: {
        delivery: 'Free Delivery',
        login: 'Login',
        cart: 'Cart',
        searchPlaceholder: 'What are you looking for...',
        searchBtn: 'Search',
        noProduct: 'No products found. Please try another keyword!',
        home: 'HOME',
        coffee: 'COFFEE',
        tea: 'TEA',
        drinks: 'DRINKS',
        products: 'PRODUCTS',
        promotions: 'PROMOTIONS',
        about: 'ABOUT US',
        profile: 'PROFILE',
        admin: 'Admin',
        logout: 'Logout',
        coffeeMenu: [
            { text: 'The Rich Coffee Cup Journey', href: '/coffee/hanh-trinh-tach-ca-phe' },
            { text: 'Phuc Long Coffee Beans', href: '/coffee/hat-ca-phe-phuc-long' },
            { text: 'The Art of Brewing', href: '/coffee/nghe-thuat-pha-che' },
        ]
    }
};

const Header = () => {
    const navigate = useNavigate();

    const [hoveredMenu, setHoveredMenu] = useState(null);
    const [cartCount, setCartCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const [products, setProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchFocused, setSearchFocused] = useState(false);

    // State quản lý ngôn ngữ (Mặc định là VN)
    const [lang, setLang] = useState('VN');

    const userMenuRef = useRef(null);
    const searchBoxRef = useRef(null);

    // Lấy ngôn ngữ hiện tại từ bộ từ điển
    const t = translations[lang];

    // ==========================================================================
    // LOGIC TÌM KIẾM SẢN PHẨM (ĐÃ CHỈNH SỬA ĐỂ RA ĐÚNG SẢN PHẨM)
    // ==========================================================================
    const searchMatches = useMemo(() => {
        const cleanQuery = customNormalizeText(searchQuery);
        
        // Nếu chưa nhập gì hoặc chỉ nhập khoảng trắng, không hiển thị danh sách gợi ý
        if (!cleanQuery) return [];

        return products
            .filter((product) => {
                if (!product || !product.name) return false;
                
                // Chuẩn hóa tên sản phẩm từ database/file json
                const cleanProductName = customNormalizeText(product.name);
                
                // Kiểm tra xem tên sản phẩm có chứa từ khóa tìm kiếm hay không
                return cleanProductName.includes(cleanQuery);
            })
            .slice(0, 10); // Giới hạn hiển thị tối đa 10 sản phẩm gợi ý
    }, [products, searchQuery]);

    // =========================
    // CART + USER
    // =========================
    useEffect(() => {
        const updateCartCount = () => {
            const savedCart = localStorage.getItem('cart');

            if (!savedCart) {
                setCartCount(0);
                return;
            }

            try {
                const cart = JSON.parse(savedCart);
                const totalItems = cart.reduce(
                    (sum, item) => sum + (item.quantity || 0),
                    0
                );
                setCartCount(totalItems);
            } catch (error) {
                console.error('Lỗi đọc giỏ hàng:', error);
                setCartCount(0);
            }
        };

        const updateCurrentUser = () => {
            const savedUser = localStorage.getItem('currentUser');

            if (!savedUser) {
                setCurrentUser(null);
                return;
            }

            try {
                const user = JSON.parse(savedUser);
                setCurrentUser(user);
            } catch (error) {
                console.error('Lỗi đọc thông tin người dùng:', error);
                setCurrentUser(null);
            }
        };

        updateCartCount();
        updateCurrentUser();

        const onStorageSync = () => {
            updateCartCount();
            updateCurrentUser();
        };

        window.addEventListener('cartUpdated', updateCartCount);
        window.addEventListener('userUpdated', updateCurrentUser);
        window.addEventListener('storage', onStorageSync);

        return () => {
            window.removeEventListener('cartUpdated', updateCartCount);
            window.removeEventListener('userUpdated', updateCurrentUser);
            window.removeEventListener('storage', onStorageSync);
        };
    }, []);

    // =========================
    // LOAD PRODUCTS
    // =========================
    useEffect(() => {
        let cancelled = false;

        const loadProducts = async () => {
            try {
                const res = await fetch(`${jsonBase}products.json`);
                if (!res.ok) return;

                const data = await res.json();
                if (cancelled) return;

                const mapped = data.map((item) => ({
                    ...item,
                    image: imageMap[item.imageKey],
                }));

                setProducts(mapped);
            } catch (err) {
                console.error('Lỗi tải sản phẩm cho tìm kiếm:', err);
            }
        };

        loadProducts();

        return () => {
            cancelled = true;
        };
    }, []);

    // =========================
    // CLOSE SEARCH WHEN CLICK OUTSIDE
    // =========================
    useEffect(() => {
        if (!searchFocused) return;

        const onPointerDown = (e) => {
            if (
                searchBoxRef.current &&
                !searchBoxRef.current.contains(e.target)
            ) {
                setSearchFocused(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
        };
    }, [searchFocused]);

    // =========================
    // CLOSE USER MENU
    // =========================
    useEffect(() => {
        if (!userMenuOpen) return;

        const onPointerDown = (e) => {
            if (
                userMenuRef.current &&
                !userMenuRef.current.contains(e.target)
            ) {
                setUserMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', onPointerDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
        };
    }, [userMenuOpen]);

    useEffect(() => {
        if (!currentUser) {
            setUserMenuOpen(false);
        }
    }, [currentUser]);

    // =========================
    // HANDLERS
    // =========================
    const handleLogout = () => {
        localStorage.removeItem('currentUser');
        setUserMenuOpen(false);
        window.dispatchEvent(new Event('userUpdated'));
        navigate('/');
    };

    const goToProduct = (product) => {
        setSearchQuery('');
        setSearchFocused(false);
        navigate(`/product/${product.id}`, {
            state: { product },
        });
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        const q = customNormalizeText(searchQuery);
        if (!q) return;

        navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchFocused(false);
    };

    const userLabel = currentUser
        ? currentUser.name || currentUser.user
        : t.login;

    return (
        <header className="phuclong-header">
            {/* ========================= */}
            {/* TOP HEADER */}
            {/* ========================= */}
            <div className="header-top-bar">
                <div className="header-top-content">
                    {/* LEFT */}
                    <div className="header-delivery-info">
                        <span className="delivery-text">{t.delivery}</span>
                        <i className="fas fa-phone delivery-icon"></i>
                        <span className="delivery-phone">1800 6779</span>
                        <div className="delivery-scooter">
                            <i className="fas fa-motorcycle"></i>
                        </div>
                    </div>

                    {/* CENTER LOGO */}
                    <div className="header-logo-container">
                        <div className="phuclong-logo">
                            <button
                                type="button"
                                className="header-logo-btn"
                                onClick={() => navigate('/')}
                                aria-label="Về trang chủ"
                            >
                                <img
                                    src={logoImg}
                                    alt="Logo"
                                    className="header-logo-image"
                                />
                            </button>
                        </div>
                    </div>

                    {/* RIGHT ACTIONS */}
                    <div className="header-user-actions">
                        {currentUser ? (
                            <div className="header-user-menu" ref={userMenuRef}>
                                <button
                                    type="button"
                                    className="login-link header-user-menu-trigger"
                                    aria-expanded={userMenuOpen}
                                    aria-haspopup="true"
                                    onClick={() => setUserMenuOpen((o) => !o)}
                                >
                                    {userLabel}
                                    <i
                                        className={`fas fa-chevron-down header-user-menu-caret ${
                                            userMenuOpen ? 'is-open' : ''
                                        }`}
                                        aria-hidden="true"
                                    />
                                </button>

                                {userMenuOpen && (
                                    <div className="header-user-dropdown" role="menu">
                                        <button
                                            type="button"
                                            className="header-user-dropdown-item"
                                            role="menuitem"
                                            onClick={() => {
                                                setUserMenuOpen(false);
                                                navigate('/profile');
                                            }}
                                        >
                                            {t.profile}
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
                                                {t.admin}
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            className="header-user-dropdown-item header-user-dropdown-item--logout"
                                            role="menuitem"
                                            onClick={handleLogout}
                                        >
                                            {t.logout}
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
                                {t.login}
                            </button>
                        )}

                        <span className="action-separator">|</span>

                        {/* NÚT CHUYỂN ĐỔI NGÔN NGỮ ĐÃ ĐƯỢC THÊM LOGIC CLICK */}
                        <div className="language-selector">
                            <span 
                                className={`lang-option ${lang === 'VN' ? 'lang-active' : ''}`}
                                onClick={() => setLang('VN')}
                            >
                                VN
                            </span>
                            <span className="lang-separator">|</span>
                            <span 
                                className={`lang-option ${lang === 'EN' ? 'lang-active' : ''}`}
                                onClick={() => setLang('EN')}
                            >
                                EN
                            </span>
                        </div>

                        <button
                            className="cart-button"
                            onClick={() => navigate('/cart')}
                        >
                            <i className="fas fa-shopping-cart"></i>
                            <span>{t.cart}</span>
                            <span className="cart-badge">{cartCount}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* ========================= */}
            {/* SEARCH */}
            {/* ========================= */}
            <div className="header-search-strip" aria-label="Tìm kiếm">
                <div className="header-search-strip__inner" ref={searchBoxRef}>
                    <form
                        className="header-search-form"
                        onSubmit={handleSearchSubmit}
                        role="search"
                    >
                        <i
                            className="fas fa-search header-search-icon"
                            aria-hidden="true"
                        />

                        <input
                            type="search"
                            className="header-search-input"
                            placeholder={t.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onFocus={() => setSearchFocused(true)}
                            aria-label="Tìm kiếm sản phẩm"
                            aria-autocomplete="list"
                            aria-controls="header-search-suggestions"
                            autoComplete="off"
                        />

                        <button type="submit" className="header-search-submit">
                            {t.searchBtn}
                        </button>
                    </form>

                    {searchFocused && searchQuery.trim().length > 0 && (
                        <ul
                            id="header-search-suggestions"
                            className="header-search__dropdown"
                            role="listbox"
                            aria-label="Gợi ý sản phẩm"
                        >
                            {searchMatches.length === 0 ? (
                                <li className="header-search__empty" role="status">
                                    <i className="fas fa-search-minus" style={{ marginRight: '8px', opacity: 0.6 }}></i>
                                    {t.noProduct}
                                </li>
                            ) : (
                                searchMatches.map((p) => (
                                    <li key={p.id} role="presentation">
                                        <button
                                            type="button"
                                            className="header-search__option"
                                            role="option"
                                            onClick={() => goToProduct(p)}
                                        >
                                            {/* Khung chứa ảnh sản phẩm */}
                                            <span className="header-search__thumb-wrap">
                                                <img
                                                    src={p.image || 'https://via.placeholder.com/88'}
                                                    alt={p.name}
                                                    className="header-search__thumb"
                                                    loading="lazy"
                                                />
                                            </span>

                                            {/* Thông tin sản phẩm (Tên & Giá) */}
                                            <span className="header-search__meta">
                                                <span className="header-search__name" title={p.name}>
                                                    {p.name}
                                                </span>
                                                {p.currentPrice && (
                                                    <span className="header-search__price">
                                                        {p.currentPrice}
                                                    </span>
                                                )}
                                            </span>

                                            {/* Icon mũi tên nhỏ bên phải để tăng tính định hướng click */}
                                            <i className="fas fa-chevron-right header-search__arrow" style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.3 }}></i>
                                        </button>
                                    </li>
                                ))
                            )}
                        </ul>
                    )}
                </div>
            </div>

            {/* ========================= */}
            {/* NAVIGATION */}
            {/* ========================= */}
            <nav className="header-navigation" aria-label="Điều hướng chính">
                <div className="nav-content">
                    <a href="/" className="nav-link">
                        {t.home}
                    </a>

                    {/* CÀ PHÊ */}
                    <div
                        className="nav-item-with-dropdown"
                        onMouseEnter={() => setHoveredMenu('coffee')}
                        onMouseLeave={() => setHoveredMenu(null)}
                    >
                        <a
                            href="/coffee"
                            className={`nav-link ${
                                hoveredMenu === 'coffee' ? 'active' : ''
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
