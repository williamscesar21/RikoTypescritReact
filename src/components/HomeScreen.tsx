import React, { useEffect, useRef } from 'react';
import '../css/HomeScreen.css';
import RestaurantList from './RestaurantList';
import ProductList from './ProductList';
import { useNavigate } from 'react-router-dom';

// Cada banner ahora tiene image + id_restaurant
const banners = [
  {
    image: 'https://firebasestorage.googleapis.com/v0/b/rikoweb-ff259.appspot.com/o/Riko%20App%20(1).png?alt=media&token=3f3ec92d-576a-4e54-9dd6-10b6d568a1d4',
    restaurantId: '68cba7725df1093fb48b3f10'
  },
  {
    image: 'https://firebasestorage.googleapis.com/v0/b/rikoweb-ff259.appspot.com/o/Riko%20App%20(1).png?alt=media&token=3f3ec92d-576a-4e54-9dd6-10b6d568a1d4',
    restaurantId: '68cba7725df1093fb48b3f10'
  },
  {
    image: 'https://firebasestorage.googleapis.com/v0/b/rikoweb-ff259.appspot.com/o/Riko%20App%20(1).png?alt=media&token=3f3ec92d-576a-4e54-9dd6-10b6d568a1d4',
    restaurantId: '68cba7725df1093fb48b3f10'
  },
];

const HomeScreen: React.FC = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const clientID = localStorage.getItem('clientId');
  const navigate = useNavigate();

  useEffect(() => {
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % banners.length;
      carouselRef.current?.scrollTo({
        left: carouselRef.current.offsetWidth * currentIndex,
        behavior: 'smooth'
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="container-home">
      {/* Header */}
      <div className="header animate-slide-in" style={{ animationDelay: '0.1s' }}>
        <img src="/logoNaranja.png" alt="Logo" className="logoImage" />
        <div
          onClick={() => navigate(`/client/${clientID}`)}
          className="headerIcons"
          style={{ backgroundColor: '#FF7F00', padding: '0rem 0.8rem', borderRadius: '20px' }}
        >
          Mi cuenta
        </div>
      </div>

      {/* Search and Location */}
      <div className="searchContainer animate-slide-in" style={{ animationDelay: '0.2s' }}>
        <div className="searchInputBox">
          <input type="text" placeholder="Buscar productos" className="searchInput" />
        </div>
        <div className="location"></div>
      </div>

      {/* Banner Carousel */}
      <div className="bannerCarousel animate-slide-in" style={{ animationDelay: '0.3s' }} ref={carouselRef}>
        {banners.map((banner, i) => (
          <div
            className="bannerCard"
            key={i}
            onClick={() => navigate(`/restaurant/${banner.restaurantId}`)}
            style={{ cursor: 'pointer' }}
          >
            <img src={banner.image} alt={`Banner ${i + 1}`} className="bannerImage" />
          </div>
        ))}
      </div>

      {/* Productos */}
      <div style={{ animationDelay: '0.5s' }}>
        <h2 className="section-title-main">Productos populares</h2>
        <ProductList />
      </div>

      {/* Restaurantes */}
      <div style={{ animationDelay: '0.6s' }}>
        <h2 className="section-title-main">Mejores Restaurantes</h2>
        <RestaurantList />
      </div>
    </div>
  );
};

export default HomeScreen;
