import React from "react";
import { useNavigate } from "react-router-dom";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  
  const imageUrl = product.image || 
    new URL(`../../img/Lsp${product.categoryId}/${product.imageKey}.jpg`, import.meta.url).href;

  const handleCardClick = () => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  return (
    <div 
      className="product-card" 
      onClick={handleCardClick}
      style={{ cursor: 'pointer', marginBottom: '20px', border: '1px solid #eee', padding: '10px' }}
    >
      <div className="product-image" style={{ position: 'relative' }}>
        <img 
          src={imageUrl} 
          alt={product.name}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onError={(e) => { 
            e.target.onerror = null; // Prevents infinite loop if placeholder fails
            e.target.src = 'https://via.placeholder.com/150?text=No+Image'; 
          }}
        />
        {product.discount && (
          <span className="discount-badge" style={{ 
            position: 'absolute', top: '5px', left: '5px', backgroundColor: 'rgba(255,255,255,0.8)', color: 'red', padding: '2px 5px', fontSize: '12px' 
          }}>
            {product.discount}
          </span>
        )}
      </div>
      
      <div className="product-info">
        <h3 className="product-name" style={{ margin: '10px 0', fontSize: '16px' }}>{product.name}</h3>
        
        <div className="product-sizes" style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
          {/* Fixed typo: product.sizesS -> product.sizeS */}
          {product.sizeS && <span style={{ marginRight: '8px' }}>{product.sizeS}</span>}
          {product.sizeM && <span style={{ marginRight: '8px' }}>{product.sizeM}</span>}
          {product.sizeL && <span style={{ marginRight: '8px' }}>{product.sizeL}</span>}
        </div>

        <div className="product-price">
          <span className="current-price" style={{ fontWeight: 'bold', color: '#e41e3f' }}>{product.currentPrice}</span>
          {product.originalPrice && (
             <span className="original-price" style={{ textDecoration: 'line-through', marginLeft: '10px', color: '#999' }}>
               {product.originalPrice}
             </span>
          )}
        </div>

        <div className="product-meta" style={{ marginTop: '5px', fontSize: '13px' }}>
          <span className="rating">⭐ {product.rating}</span>
          <span className="sold" style={{ marginLeft: '10px' }}>Đã bán {product.sold}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
