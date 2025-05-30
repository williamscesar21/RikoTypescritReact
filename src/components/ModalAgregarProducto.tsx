import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import '../css/ModalAgregarProducto.css';

interface ModalAgregarProductoProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    _id: string;
    nombre: string;
    precio: number;
    id_restaurant: string;
  };
}

const ModalAgregarProducto: React.FC<ModalAgregarProductoProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [clientId, setClientId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedClient = localStorage.getItem('clientId');
    setClientId(storedClient);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleAgregar = async () => {
    if (!clientId) {
      setError('Cliente no autenticado.');
      return;
    }

    if (quantity < 1 || isNaN(quantity)) {
      setError('La cantidad debe ser mayor o igual a 1.');
      return;
    }

    const payload = {
      productId: item._id,
      quantity,
      client: { _id: clientId },
      id_restaurant: item.id_restaurant,
    };

    console.log('Payload a enviar:', JSON.stringify(payload, null, 2));
    setLoading(true);
    setError('');

    try {
      await axios.post('https://rikoapi.onrender.com/api/cart/add', payload);
    //   alert('Producto agregado al carrito');
      onClose();
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      setError('Error al agregar el producto. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" ref={modalRef}>
        <h3>Agregar {item.nombre}</h3>
        <p>Precio: ${item.precio}</p>

        <div className="quantity-selector">
          <button
            className="qty-btn"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            -
          </button>
          <span className="qty-value">{quantity}</span>
          <button
            className="qty-btn"
            onClick={() => setQuantity((q) => q + 1)}
          >
            +
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="modal-buttons">
          <button onClick={handleAgregar} disabled={loading}>
            {loading ? 'Agregando...' : 'Agregar'}
          </button>
          <button onClick={onClose} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAgregarProducto;
