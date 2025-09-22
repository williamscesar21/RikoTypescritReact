import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import DishRow from './Dishrow';
import { Star, MapPin, ArrowLeft } from 'react-feather';
import '../css/RestaurantScreen.css';

interface Restaurant {
  _id: string;
  nombre: string;
  descripcion: string;
  ubicacion: string;
  calificacion: {
    promedio: number;
    calificaciones: any[];
  };
  horario_de_trabajo: {
    dia: string;
    inicio: string;
    fin: string;
  }[];
  images: string[] | string;
  suspendido?: boolean; // 👈 agregado
}

interface Product {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  images: string[];
  id_restaurant: string;
  tags?: string[];
  suspendido?: boolean; // 👈 agregado
}

const RestaurantScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

useEffect(() => {
  if (!id) return;

  const fetchData = () => {
    // 🔹 Traer datos del restaurante
    axios
      .get(`https://rikoapi.onrender.com/api/restaurant/restaurant/${id}`)
      .then((response) => setRestaurant(response.data))
      .catch((error) =>
        console.error('Error fetching restaurant data:', error)
      );

    // 🔹 Traer productos y filtrar suspendidos
    axios
      .get('https://rikoapi.onrender.com/api/product/product')
      .then((response) => {
        const filtered = response.data.filter(
          (p: Product) =>
            p.id_restaurant === id &&
            (p.suspendido === false || p.suspendido === undefined)
        );
        setProducts(filtered);

        // Extraer y normalizar tags únicos
        const allTags: string[] = Array.from(
          new Set(filtered.flatMap((p: Product) => p.tags || []))
        );
        setTags(allTags);
      })
      .catch((error) => console.error('Error fetching products:', error));
  };

  // Primera ejecución inmediata
  fetchData();

  // Intervalo cada 1 segundo
  const interval = setInterval(fetchData, 1000);

  // Limpiar intervalo al desmontar
  return () => clearInterval(interval);
}, [id]);


  const isRestaurantOpen = () => {
    if (!restaurant || !restaurant.horario_de_trabajo) return false;
    const now = new Date();
    const day = now.toLocaleDateString('es-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const today = restaurant.horario_de_trabajo.find(
      (d) => d.dia.toLowerCase() === day
    );
    if (today) {
      const open = parseInt(today.inicio.replace(':', ''));
      const close = parseInt(today.fin.replace(':', ''));
      return currentTime >= open && currentTime <= close;
    }
    return false;
  };

  const imageUrl = Array.isArray(restaurant?.images)
    ? restaurant.images[0]
    : restaurant?.images;

  // 🔹 Filtrar productos por tag
  const filteredProducts = selectedTag
    ? products.filter((p) => p.tags?.includes(selectedTag))
    : products;

  if (!restaurant) {
    return (
      <div className="loading-screen">
        <img src="/logoNaranja.png" alt="loading" />
        <h2 style={{ color: 'black' }}>Cargando...</h2>
      </div>
    );
  }
  if (restaurant.suspendido) {
    return (
      <div className="suspended-screen" style={{ textAlign: 'center', padding: '2rem', justifyContent: 'center', alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', height: '90vh' }}>
        <img src="/suspendido.png" alt="suspended" className="suspended-image" style={{ width: '100px' }} />
        <h2 style={{ color: 'black', textAlign: 'center' }}>
          Lo sentimos, este restaurante está temporalmente suspendido.
        </h2>
        <button onClick={() => navigate('/restaurants')} className="browse-button">
            Explorar otros restaurantes
        </button>
      </div>
    );
  }

  return (
    <div className="restaurant-screen">
      <div className="header-image-container">
        <img src={imageUrl} alt="Restaurant" className="header-image" />
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft color="white" size={20} />
        </button>
      </div>

      <div className="restaurant-details">
        <div className="restaurant-info">
          <h1>{restaurant.nombre}</h1>
          <div className="meta">
            <div className="meta-item">
              <Star size={16} color="#facc15" />
              <span>
                {restaurant.calificacion.promedio} ·{' '}
                {restaurant.calificacion.calificaciones.length}
              </span>
            </div>
            <div className="meta-item">
              <MapPin size={16} color="#facc15" />
              <span>Cerca de · {restaurant.ubicacion}</span>
            </div>
          </div>
          <p className={isRestaurantOpen() ? 'open' : 'closed'}>
            {isRestaurantOpen() ? 'Abierto Ahora' : 'Cerrado Ahora'}
          </p>
        </div>
        <p className="restaurant-description">{restaurant.descripcion}</p>
      </div>

      <div className="restaurant-menu">
        <h2>Menú</h2>

        {tags.length > 0 && (
          <div className="menu-tags">
            <button
              className={`tag-button ${!selectedTag ? 'active' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              Todos
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                className={`tag-button ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <div className="menu-items">
          {filteredProducts.map((dish, index) => (
            <DishRow item={dish} key={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RestaurantScreen;
