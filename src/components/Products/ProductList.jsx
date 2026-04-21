import React, { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import './ProductList.css'; 
import sp1Image from '../../img/Lsp1/sp1.jpg';
import sp2Image from '../../img/Lsp1/sp2.jpg';
import sp3Image from '../../img/Lsp1/sp3.jpg';
import sp4Image from '../../img/Lsp1/sp4.jpg';
import sp5Image from '../../img/Lsp1/sp5.jpg';
import sp6Image from '../../img/Lsp1/sp6.jpg';
import sp7Image from '../../img/Lsp1/sp7.jpg';
import sp8Image from '../../img/Lsp1/sp8.jpg';
import sp9Image from '../../img/Lsp1/sp9.jpg';
import sp10Image from '../../img/Lsp1/sp10.jpg';

const imageMap = {
    sp1: sp1Image,
    sp2: sp2Image,
    sp3: sp3Image,
    sp4: sp4Image,
    sp5: sp5Image,
    sp6: sp6Image,
    sp7: sp7Image,
    sp8: sp8Image,
    sp9: sp9Image,
    sp10: sp10Image
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
