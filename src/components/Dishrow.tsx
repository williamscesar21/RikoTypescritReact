import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/DishRow.css';
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

interface DishRowProps {
  item: DishItem;
}

const DishRow: React.FC<DishRowProps> = ({ item }) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  // const clientId = 'client-id-placeholder'; // puedes usar auth o contexto si tienes login

  const goToProductScreen = () => {
    navigate(`/product/${item._id}`);
  };

  const truncateDescription = (description: string) => {
    const words = description.split(' ');
    return words.length > 10 ? words.slice(0, 4).join(' ') + '...' : description;
  };

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
          <p className="dish-description">{truncateDescription(item.descripcion)}</p>

          <div className="dish-footer">
            <span className="dish-price">${item.precio}</span>
            <div className="counter-controls">
              <BotonAgregar onAgregar={() => setModalOpen(true)} />
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
