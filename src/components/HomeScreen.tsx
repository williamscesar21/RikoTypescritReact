import React, { useEffect, useRef } from 'react';
import { FaMapMarkerAlt, FaComments, FaBell } from 'react-icons/fa';
import '../css/HomeScreen.css';
import RestaurantList from './RestaurantList';
import ProductList from './ProductList';

const categories = [
  'Todo', 'Fast Food', 'Cenas', 'Postres', 'Bebidas', 'Comida Rápida',
  'Comida Italiana', 'Comida Mexicana', 'Comida Argentina', 'Comida Peruana'
];

const banners = [
  'https://firebasestorage.googleapis.com/v0/b/rikoweb-ff259.appspot.com/o/delicious-indian-meal-with-biryani-rice-photo.jpeg?alt=media&token=d34e2bc2-99c0-440a-b00b-c2dc929d3a73',
  'https://firebasestorage.googleapis.com/v0/b/rikoweb-ff259.appspot.com/o/Rectangle%2022.png?alt=media&token=7f6f1846-5906-45d5-8fbd-37ec0a4f2a26',
  'https://d1csarkz8obe9u.cloudfront.net/posterpreviews/delicious-food-banner-template-design-cd3994e39458960f4f33e73b8c60edb9_screen.jpg?ts=1645769305',
];

const HomeScreen: React.FC = () => {
  const carouselRef = useRef<HTMLDivElement>(null);

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
        <div className="headerIcons">
          <FaComments className="icon" />
          <FaBell className="icon" />
        </div>
      </div>

      {/* Search and Location */}
      <div className="searchContainer animate-slide-in" style={{ animationDelay: '0.2s' }}>
        <div className="searchInputBox">
          <input type="text" placeholder="Buscar productos" className="searchInput" />
        </div>
        <div className="location">
          <FaMapMarkerAlt />
          <span>Acarigua</span>
        </div>
      </div>

      {/* Banner Carousel */}
      <div className="bannerCarousel animate-slide-in" style={{ animationDelay: '0.3s' }} ref={carouselRef}>
        {banners.map((src, i) => (
          <div className="bannerCard" key={i}>
            <img src={src} alt={`Banner ${i + 1}`} className="bannerImage" />
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="categories animate-slide-in" style={{ animationDelay: '0.4s' }}>
        {categories.map((cat, index) => (
          <button key={index} className={index === 0 ? 'categoryButton active' : 'categoryButton'}>
            {cat}
          </button>
        ))}
      </div>

      {/* Productos */}
      <div className="section-block animate-slide-in" style={{ animationDelay: '0.5s' }}>
        <h2 className="section-title-main">Productos populares</h2>
        <ProductList />
      </div>

      {/* Restaurantes */}
      <div className="section-block animate-slide-in" style={{ animationDelay: '0.6s' }}>
        <h2 className="section-title-main">Mejores Restaurantes</h2>
        <RestaurantList />
      </div>
    </div>
  );
};

export default HomeScreen;