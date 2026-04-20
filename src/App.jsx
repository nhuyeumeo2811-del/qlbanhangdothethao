import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import DetailProduct from './components/Products/DetailProduct';
import ProductList from "./components/Products/ProductList";

function App() {
  const location = useLocation();
  return (
    <>
      <Header />
      <DetailProduct />
      <ProductList />
      <Footer />
    </>
  );
}

export default App;
