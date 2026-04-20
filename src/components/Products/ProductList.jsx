import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import './ProductList.css'; // Fixed typo in filename
import sp1Image from '../../img/Lsp1/sp1.jpg';
import sp2Image from '../../img/Lsp1/sp2.jpg';
import sp3Image from '../../img/Lsp1/sp3.jpg';

const imageMap = {
    sp1: sp1Image,
    sp2: sp2Image,
    sp3: sp3Image
};

const ProductList = () => { 
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                
                const response = await fetch('./products.json');
                
                if (!response.ok) {
                    throw new Error('Không thể tải dữ liệu sản phẩm');
                }

                const data = await response.json();
                
                const mappedProducts = data.map((item) => ({
                    ...item,

                    image: imageMap[item.imageKey] || item.image 
                }));

                setProducts(mappedProducts);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();
    }, []);

    if (isLoading) {
        return <div className="product-list-container">Đang tải sản phẩm...</div>;
    }

    if (error) {
        
        return <div className="product-list-container">Lỗi: {error}</div>; 
    }

    return (
        <div className="product-list-container">
            <div className="product-list">
                {products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))
                ) : (
                    <p>Không tìm thấy sản phẩm nào.</p>
                )}
            </div>
        </div>
    );
};

export default ProductList;
