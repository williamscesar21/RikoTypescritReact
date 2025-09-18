import React, { useEffect, useRef, useState } from 'react';
import '../css/HomeScreen.css';
import RestaurantList from './RestaurantList';
import ProductList from './ProductList';
import DishRow from './Dishrow';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

interface Product {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  images: string[];
  id_restaurant: string;
  suspendido?: boolean;
}

const HomeScreen: React.FC = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const clientID = localStorage.getItem('clientId');
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

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

  // Función de búsqueda
  const searchProducts = async (query: string) => {
    if (!query.trim()) {
      setProducts([]); // limpia resultados si está vacío
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get("https://rikoapi.onrender.com/api/product/product");
      const allProducts: Product[] = response.data;

      // Filtro por coincidencia en el nombre
      const filtered = allProducts.filter(p =>
        !p.suspendido &&
        p.nombre.toLowerCase().includes(query.toLowerCase()),
      );

      setProducts(filtered);
    } catch (error) {
      console.error("Error buscando productos:", error);
    } finally {
      setLoading(false);
    }
  };

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
          <input
            type="text"
            placeholder="Buscar productos"
            className="searchInput"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              searchProducts(e.target.value);
            }}
          />
        </div>
        <div className="location"></div>
      </div>

      {/* Banner Carousel */}
      {!searchTerm && (
        <div
          className="bannerCarousel animate-slide-in"
          style={{ animationDelay: '0.3s' }}
          ref={carouselRef}
        >
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
      )}

      {/* Resultados de búsqueda */}
      {searchTerm && (
        <div className="searchResults">
          <h2 className="section-title-main">Resultados</h2>
          {loading && <p>Cargando...</p>}
          {!loading && products.length === 0 && <p>No se encontraron productos</p>}
          {products.map((item) => (
            <DishRow key={item._id} item={item} />
          ))}
        </div>
      )}

      {/* Productos populares */}
      {!searchTerm && (
        <div style={{ animationDelay: '0.5s' }}>
          <h2 className="section-title-main">Productos populares</h2>
          <ProductList />
        </div>
      )}

      {/* Restaurantes */}
      {!searchTerm && (
        <div style={{ animationDelay: '0.6s' }}>
          <h2 className="section-title-main">Mejores Restaurantes</h2>
          <RestaurantList />
        </div>
      )}
    </div>
  );
};

export default HomeScreen;
