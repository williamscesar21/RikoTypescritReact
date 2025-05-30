import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/RestaurantList.css';

interface Restaurant {
  _id: string;
  nombre: string;
  descripcion: string;
  images: string[];
  ubicacion: string;
  telefono: string;
  email: string;
}

const RestaurantList: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get('https://rikoapi.onrender.com/api/restaurant/restaurants');
        setRestaurants(response.data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
    const intervalId = setInterval(fetchRestaurants, 2000);

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
    <div className="restaurant-list">
      {restaurants.map((item) => (
        <div
          key={item._id}
          className="restaurant-card"
          onClick={() => handleClick(item._id)}
          style={{ cursor: 'pointer' }}
        >
          <img src={item.images[0]} alt={item.nombre} className="restaurant-image" />
          <div className="restaurant-info">
            <h3 className="restaurant-title">{item.nombre}</h3>
            <p className="restaurant-desc">{truncateDescription(item.descripcion)}</p>
            <p className="restaurant-location">📍 {item.ubicacion}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RestaurantList;
