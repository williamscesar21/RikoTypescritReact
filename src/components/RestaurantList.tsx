import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/RestaurantList.css';
import { CiStar } from "react-icons/ci";

interface Restaurant {
  _id: string;
  nombre: string;
  descripcion: string;
  images: string[];
  ubicacion: string; // formato esperado: "lat,lon"
  telefono: string;
  email: string;
  suspendido?: boolean;
  calificacion?: {
    promedio: number;
    calificaciones: any[];
  };
}

// 📍 Función para calcular distancia en km
function getDistanceKm(coord1: string, coord2: string): number {
  if (!coord1 || !coord2) return 0;
  const [lat1, lon1] = coord1.split(',').map(Number);
  const [lat2, lon2] = coord2.split(',').map(Number);

  if ([lat1, lon1, lat2, lon2].some(isNaN)) return 0;

  const R = 6371; // radio de la Tierra en km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

const RestaurantList: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get(
          'https://rikoapi.onrender.com/api/restaurant/restaurants'
        );

        // Ordenar los restaurantes por mejor calificación
        const sorted = response.data.sort(
          (a: Restaurant, b: Restaurant) =>
            (b.calificacion?.promedio || 0) - (a.calificacion?.promedio || 0)
        );

        setRestaurants(sorted);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
    const intervalId = setInterval(fetchRestaurants, 2000);

    // Leer ubicación del usuario desde localStorage
    const location = localStorage.getItem('userLocation');
    if (location) setUserLocation(location);

    return () => clearInterval(intervalId);
  }, []);

  const truncateDescription = (description: string) => {
    const words = description.split(' ');
    return words.length > 10 ? words.slice(0, 5).join(' ') + '...' : description;
  };

  const handleClick = (id: string) => {
    navigate(`/restaurant/${id}`);
  };

  if (loading) return <div className="loading">Cargando Restaurantes...</div>;

  return (
    <div className="restaurant-list animate-slide-in">
      {restaurants
        .filter((item) => item.suspendido === false)
        .map((item) => {
          const distance = userLocation
            ? getDistanceKm(userLocation, item.ubicacion).toFixed(2)
            : null;

          return (
            <div
              key={item._id}
              className="restaurant-card"
              onClick={() => handleClick(item._id)}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={item.images[0]}
                alt={item.nombre}
                className="restaurant-image"
              />
              <div className="restaurant-info">
                <h3 className="restaurant-title">{item.nombre}</h3>
                <p className="restaurant-desc">
                  {truncateDescription(item.descripcion)}
                </p>
                {distance ? (
                  <p className="restaurant-location">📍 A {distance} km de ti</p>
                ) : (
                  <p className="restaurant-location">📍 Ubicación no disponible</p>
                )}
                <p className="restaurant-rating" style={{ fontWeight: 'bold', color: '#FF7F00', margin:'0', alignItems:'center', display:'flex', gap:'0.2rem', fontSize:'0.8rem' }}>
                  <CiStar /> {item.calificacion?.promedio.toFixed(1) || 'N/A'}
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default RestaurantList;
