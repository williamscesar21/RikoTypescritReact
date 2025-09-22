import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/Dishrow.css';
import BotonAgregar from './BotonAgregar';
import ModalAgregarProducto from './ModalAgregarProducto';

interface DishItem {
  _id: string;
  nombre: string;
  descripcion: string;
  images: string[];
  precio: number;
  id_restaurant: string;
}

interface Restaurant {
  _id: string;
  horario_de_trabajo: {
    dia: string;
    inicio: string;
    fin: string;
  }[];
}

interface DishRowProps {
  item: DishItem;
}

const DishRow: React.FC<DishRowProps> = ({ item }) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(true); // por defecto abierto

  const goToProductScreen = () => {
    navigate(`/product/${item._id}`);
  };

  const truncateDescription = (description: string) => {
    const words = description.split(' ');
    return words.length > 10 ? words.slice(0, 4).join(' ') + '...' : description;
  };

  // 🔹 Verificar si el restaurante está abierto
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const { data } = await axios.get<Restaurant>(
          `https://rikoapi.onrender.com/api/restaurant/restaurant/${item.id_restaurant}`
        );

        if (data.horario_de_trabajo) {
          const now = new Date();
          const day = now
            .toLocaleDateString('es-ES', { weekday: 'long' })
            .toLowerCase();
          const currentTime = now.getHours() * 100 + now.getMinutes();

          const today = data.horario_de_trabajo.find(
            (d) => d.dia.toLowerCase() === day
          );

          if (today) {
            const open = parseInt(today.inicio.replace(':', ''));
            const close = parseInt(today.fin.replace(':', ''));
            setIsOpen(currentTime >= open && currentTime <= close);
          } else {
            setIsOpen(false);
          }
        } else {
          setIsOpen(false);
        }
      } catch (error) {
        console.error('❌ Error al obtener restaurante:', error);
        setIsOpen(false);
      }
    };

    fetchRestaurant();
  }, [item.id_restaurant]);

  return (
    <>
      <div className="dish-row-card" onClick={goToProductScreen}>
        {item.images && item.images[0] ? (
          <img src={item.images[0]} alt={item.nombre} className="dish-image" />
        ) : (
          <div className="dish-image-placeholder" />
        )}

        <div className="dish-content">
          <h3 className="dish-title">{item.nombre}</h3>
          <p className="dish-description">
            {truncateDescription(item.descripcion)}
          </p>

          <div className="dish-footer">
            <span className="dish-price">${item.precio}</span>
            <div className="counter-controls">
              {isOpen ? (
                <BotonAgregar onAgregar={() => setModalOpen(true)} />
              ) : (
                <span className="closed-label">Cerrado</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <ModalAgregarProducto
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={item}
      />
    </>
  );
};

export default DishRow;
