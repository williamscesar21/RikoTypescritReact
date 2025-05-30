import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import Navbar from './components/Navbar';
import './App.css'; // Asegúrate de importar el CSS
import RestaurantScreen from './components/RestaurantScreen';
import ProductScreen from './components/ProductScreen';
import CartScreen from './components/CartScreen';
import RestaurantsSection from './components/RestaurantsSection';

const App: React.FC = () => {
  const token = localStorage.getItem('token');

  return (
    <BrowserRouter>
      {token ? (
        <div className="app-container">
          <Navbar />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/home" />} />
              <Route path="/home" element={<HomeScreen />} />
              <Route path="/restaurant/:id" element={<RestaurantScreen />} />
              <Route path="/product/:id" element={<ProductScreen />} />
              <Route path="/bolsita" element={<CartScreen />} />
              <Route path="*" element={<Navigate to="/home" />} />
              <Route path="/restaurants" element={<RestaurantsSection />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;
