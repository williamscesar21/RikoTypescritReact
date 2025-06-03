import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginScreen from './components/LoginScreen';
import HomeScreen from './components/HomeScreen';
import Navbar from './components/Navbar';
import './App.css';
import RestaurantScreen from './components/RestaurantScreen';
import ProductScreen from './components/ProductScreen';
import CartScreen from './components/CartScreen';
import RestaurantsSection from './components/RestaurantsSection';
import PedidosScreen from './components/PedidosScreen';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import PedidoDetailsScreen from './components/PedidoDetailsScreen';

const App: React.FC = () => {
  const token = localStorage.getItem('token');

  // 🛰️ Efecto para rastreo de ubicación continuo
  useEffect(() => {
    let watchIdCapacitor: string | null = null;
    let watchIdWeb: number | null = null;

    const startTracking = async () => {
      try {
        if (Capacitor.getPlatform() !== 'web') {
          const permission = await Geolocation.requestPermissions();
          if (permission.location === 'granted') {
            watchIdCapacitor = await Geolocation.watchPosition({}, (position, err) => {
              if (err) {
                console.error('❌ Error tracking (Capacitor):', err);
                return;
              }

              if (position && position.coords) {
                const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
                localStorage.setItem('userLocation', coords);
                console.log('📡 Ubicación actual (Capacitor):', coords);
              }
            });
          }
        } else {
          if ('geolocation' in navigator) {
            watchIdWeb = navigator.geolocation.watchPosition(
              (position) => {
                const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
                localStorage.setItem('userLocation', coords);
                console.log('📡 Ubicación actual (Web):', coords);
              },
              (error) => {
                console.error('❌ Error tracking (Web):', error);
              },
              { enableHighAccuracy: true }
            );
          }
        }
      } catch (error) {
        console.error('❌ Error general al iniciar el tracking de ubicación:', error);
      }
    };

    if (token) startTracking();

    return () => {
      if (Capacitor.getPlatform() !== 'web') {
        if (watchIdCapacitor) {
          Geolocation.clearWatch({ id: watchIdCapacitor });
        }
      } else {
        if (watchIdWeb !== null && navigator.geolocation.clearWatch) {
          navigator.geolocation.clearWatch(watchIdWeb);
        }
      }
    };
  }, [token]);

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
              <Route path="/restaurants" element={<RestaurantsSection />} />
              <Route path="/pedidos" element={<PedidosScreen />} />
              <Route path="/pedido/:id" element={<PedidoDetailsScreen />} />
              <Route path="*" element={<Navigate to="/home" />} />
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
