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
import ClientScreen from './components/ClientScreen';
import ChatScreen from './components/ChatScreen';
import ForgotPassword from './components/ForgotPassword';
import { StatusBar, Style } from "@capacitor/status-bar";
import { Device } from "@capacitor/device";
import ProductsScreen from './components/ProductsScreen';
import { LocalNotifications } from '@capacitor/local-notifications';

const App: React.FC = () => {
  const token = localStorage.getItem('token');

  // ✅ Pedir permisos al inicio
  useEffect(() => {
    const requestPermissions = async () => {
      try {
        // 📍 Ubicación
        const geoPerms = await Geolocation.requestPermissions();
        console.log("📍 Permisos de ubicación:", geoPerms);

        // 🔔 Notificaciones (solo móvil, no web)
        if (Capacitor.getPlatform() !== "web") {
          const notifPerms = await LocalNotifications.requestPermissions();
          console.log("🔔 Permisos de notificaciones:", notifPerms);
        }
      } catch (e) {
        console.error("❌ Error solicitando permisos:", e);
      }
    };

    requestPermissions();
  }, []);

  // ✅ Ajuste de safe area en Android
  useEffect(() => {
    const fixSafeArea = async () => {
      if (Capacitor.getPlatform() === "android") {
        try {
          const info = await Device.getInfo();
          console.log("📱 Device info:", info);

          const main = document.querySelector(".main-content") as HTMLElement;
          if (main) {
            main.style.paddingBottom = "24px";
          }
        } catch (e) {
          console.error("❌ Error ajustando safe area:", e);
        }
      }
    };
    fixSafeArea();
  }, []);

  // 🛰️ Efecto para rastreo de ubicación continuo
  useEffect(() => {
    let watchIdCapacitor: string | null = null;
    let watchIdWeb: number | null = null;

    const startTracking = async () => {
      try {
        if (Capacitor.getPlatform() !== "web") {
          const permission = await Geolocation.checkPermissions();
          if (permission.location === "granted") {
            watchIdCapacitor = await Geolocation.watchPosition(
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              },
              (position, err) => {
                if (err) {
                  console.error("❌ Error tracking (Capacitor):", err);
                  return;
                }

                if (position?.coords) {
                  const coords = `${position.coords.latitude},${position.coords.longitude}`;
                  const accuracy = position.coords.accuracy || null;

                  localStorage.setItem("userLocation", coords);
                  if (accuracy) {
                    localStorage.setItem("userAccuracy", accuracy.toString());
                  }

                  console.log("📡 Ubicación actual (Capacitor):", coords, "| Precisión:", accuracy, "m");
                }
              }
            );
          }
        } else {
          if ("geolocation" in navigator) {
            watchIdWeb = navigator.geolocation.watchPosition(
              (position) => {
                const coords = `${position.coords.latitude},${position.coords.longitude}`;
                const accuracy = position.coords.accuracy || null;

                localStorage.setItem("userLocation", coords);
                if (accuracy) {
                  localStorage.setItem("userAccuracy", accuracy.toString());
                }

                console.log("📡 Ubicación actual (Web):", coords, "| Precisión:", accuracy, "m");
              },
              (error) => {
                console.error("❌ Error tracking (Web):", error);
              },
              {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              }
            );
          }
        }
      } catch (error) {
        console.error("❌ Error general al iniciar el tracking de ubicación:", error);
      }
    };

    if (token) startTracking();

    return () => {
      if (Capacitor.getPlatform() !== "web") {
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

  // 💵 Dólar oficial
  useEffect(() => {
    const fetchDollar = async () => {
      try {
        const res = await fetch("https://ve.dolarapi.com/v1/dolares/oficial");
        const data = await res.json();

        if (data?.promedio) {
          localStorage.setItem("dolarenbs", data.promedio.toString());
          console.log("💵 Dólar en BS guardado:", data.promedio);
        }
      } catch (error) {
        console.error("❌ Error obteniendo dólar oficial:", error);
      }
    };

    fetchDollar();
  }, []);

  useEffect(() => {
    const adjustSafeArea = async () => {
      if (Capacitor.getPlatform() === "android") {
        await StatusBar.setBackgroundColor({ color: "#000000" });
        await StatusBar.setStyle({ style: Style.Light });
      }
    };
    adjustSafeArea();
  }, []);

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
              <Route path="/client/:id" element={<ClientScreen />} />
              <Route path="/product/:id" element={<ProductScreen />} />
              <Route path="/bolsita" element={<CartScreen />} />
              <Route path="/restaurants" element={<RestaurantsSection />} />
              <Route path="/productos" element={<ProductsScreen />} />
              <Route path="/pedidos" element={<PedidosScreen />} />
              <Route path="/pedido/:id" element={<PedidoDetailsScreen />} />
              <Route path="/chat/:orderId" element={<ChatScreen />} />
              <Route path="*" element={<Navigate to="/home" />} />
            </Routes>
          </div>
        </div>
      ) : (
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </BrowserRouter>
  );
};

export default App;
