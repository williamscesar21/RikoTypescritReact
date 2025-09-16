import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../css/RestaurantsSection.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'react-feather'; 
import { CiStar } from "react-icons/ci";

interface Restaurant {
  _id: string;
  nombre: string;
  descripcion: string;
  images: string[];
  calificacion: {
    promedio: number;
  };
  suspendido?: boolean; // 👈 agregado
}

const RestaurantsSection: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get<Restaurant[]>(
          'https://rikoapi.onrender.com/api/restaurant/restaurants'
        );

        // 🔎 Filtrar suspendidos y ordenar por calificación
        const activeRestaurants = response.data
          .filter((rest) => rest.suspendido === false || rest.suspendido === undefined)
          .sort((a, b) => b.calificacion.promedio - a.calificacion.promedio);

        setRestaurants(activeRestaurants);
        setFilteredRestaurants(activeRestaurants);
      } catch (error) {
        console.error('Error al cargar restaurantes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    const term = searchTerm.toLowerCase();
    const filtered = restaurants.filter(
      (rest) =>
        rest.nombre.toLowerCase().includes(term) ||
        rest.descripcion.toLowerCase().includes(term)
    );
    setFilteredRestaurants(filtered);
  }, [searchTerm, restaurants]);

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="/logoNaranja.png" alt="loading" />
        <h2 style={{ color: 'black' }}>Cargando...</h2>
      </div>
    );
  }

  return (
    <section className="restaurants-section">
      <div className="header-row">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
        </button>
        <h2 className="titulo-pedidos animate-slide-in">Restaurantes</h2>
      </div>

      <input
        type="text"
        placeholder="Buscar restaurante..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="restaurant-search-input animate-slide-in"
      />

      <div className="restaurant-s-grid">
        {filteredRestaurants.length > 0 ? (
          filteredRestaurants.map((rest) => (
            <div
              key={rest._id}
              onClick={() => navigate(`/restaurant/${rest._id}`)}
              className="restaurant-s-card animate-slide-in"
            >
              <img
                src={rest.images[0]}
                alt={rest.nombre}
                className="restaurant-s-image"
              />
              <div className="restaurant-s-info">
                <p className="restaurant-s-name">{rest.nombre}</p>
                <p className="restaurant-s-desc">{rest.descripcion}</p>
                <div className="restaurant-s-rating">
                  {rest.calificacion.promedio > 0 ? (
                    <span className="rating" style={{ fontWeight: 'bold', color: '#FF7F00', margin:'0', alignItems:'center', display:'flex', gap:'0.2rem', fontSize:'0.8rem' }}>
                      <CiStar />
                      {rest.calificacion.promedio.toFixed(1)}
                    </span>
                  ) : (
                    <span className="no-rating">Sin calificación</span>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-results">No se encontraron restaurantes.</p>
        )}
      </div>
    </section>
  );
};

export default RestaurantsSection;
