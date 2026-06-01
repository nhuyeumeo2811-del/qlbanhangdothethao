import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ProductCard.css';

const productsUrl = `${import.meta.env.BASE_URL}products.json`;

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleBuy = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(productsUrl);
      if (!response.ok) {
        throw new Error('Không thể tải thông tin sản phẩm');
      }

      const data = await response.json();
      const matchedProduct = data.find((item) => item.id === product.id);
      if (!matchedProduct) {
        throw new Error('Sản phẩm không tồn tại');
      }
      navigate(`/product/${product.id}`, {
        state: { product: { ...matchedProduct, image: product.image } }
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="product-card">
      <div className="product-image-container">
        <img
          src={product.image || 'https://via.placeholder.com/300x200'}
          alt={product.name}
          className="product-image"
        />
      </div>
      <h3 className="product-name">{product.name}</h3>
      <div className="product-ram-ssd">
        <button className="ram-ssd-tag">{product.sizeS}</button>
        <button className="ram-ssd-tag">{product.sizeM}</button>
        <button className="ram-ssd-tag">{product.sizeL}</button>
      </div>
      <div className="product-pricing">
        <div className="current-price">{product.currentPrice}</div>
        <div className="original-price-section">
          <span className='original-price'>{product.originalPrice}</span>
          {product.discount && <span className="discount">{product.discount}</span>}
        </div>
      </div>

      <div className="product-rating-sales">
        <span className="rating">⭐ {product.rating}</span>
        <span className="sales">Đã bán {product.sold}</span>
      </div>

      <button className="compare-button" onClick={handleBuy} disabled={isLoading}>
        {isLoading ? 'Đang mở...' : 'Mua'}
      </button>
      {error && <div className="error-text">{error}</div>}
    </div>
  );
};

export default ProductCard;
