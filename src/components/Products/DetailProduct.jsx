import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import './DetailProduct.css';
import sp1Image from '../../img/Lsp1/sp1.jpg';
import sp2Image from '../../img/Lsp1/sp2.jpg';
import sp3Image from '../../img/Lsp1/sp3.jpg';

const imageMap = {
    sp1: sp1Image,
    sp2: sp2Image,
    sp3: sp3Image
};

const DetailProduct = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    

    const [product, setProduct] = useState(location.state?.product || null);
    const [isLoading, setIsLoading] = useState(!location.state?.product);
    const [error, setError] = useState(null);

    useEffect(() => {

        if (product && String(product.id) === String(id)) {
            setIsLoading(false);
            return;
        }

        const fetchProduct = async () => {
            setIsLoading(true);
            try {
                const response = await fetch('/products.json');
                if (!response.ok) {
                    throw new Error('Không thể tải thông tin sản phẩm');
                }

                const data = await response.json();
                const found = data.find((item) => String(item.id) === String(id));
                
                if (!found) {
                    throw new Error('Sản phẩm không tồn tại');
                }

                setProduct({
                    ...found,
                    image: imageMap[found.imageKey] || found.image
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();

    }, [id]); 

    const handleBuyNow = useCallback(() => {
        if (!product) return;

        const savedCart = localStorage.getItem('cart');
        const cart = savedCart ? JSON.parse(savedCart) : [];
        const existingItemIndex = cart.findIndex(item => String(item.id) === String(product.id));

        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        
        
        window.dispatchEvent(new Event('cartUpdated')); 
        navigate('/cart');
    }, [product, navigate]);

    if (isLoading) return <div className="detail-container">Đang tải chi tiết sản phẩm...</div>;
    if (error) return <div className="detail-container">Lỗi: {error}</div>;
    if (!product) return <div className="detail-container">Không tìm thấy sản phẩm</div>;

    return (
        <div className="detail-container">
            <button className="back-button" onClick={() => navigate(-1)}>
                &larr; Quay lại
            </button>

            <div className="detail-card">
                <div className="detail-image">
                    <img 
                        src={product.image || 'https://via.placeholder.com/500x350'} 
                        alt={product.name} 
                    />
                </div>

                <div className="detail-info">
                    <h2>{product.name}</h2>
                    
                    <div className="detail-price">
                        <span className="current-price">{product.currentPrice}</span>
                        {product.originalPrice && (
                            <span className="original-price">{product.originalPrice}</span>
                        )}
                        {product.discount && (
                            <span className="discount">{product.discount}</span>
                        )}
                    </div>

                    <div className="detail-sizes">
                        {['sizeS', 'sizeM', 'sizeL'].map(size => (
                            product[size] && <button key={size} className="ram-ssd-tag">{product[size]}</button>
                        ))}
                    </div>

                    <div className="detail-meta">
                        {product.rating && <span>⭐ {product.rating}</span>}
                        {product.sold && <span> Đã bán {product.sold}</span>}
                    </div>

                    <button className="buy-now-button" onClick={handleBuyNow}>
                        Mua ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DetailProduct;
