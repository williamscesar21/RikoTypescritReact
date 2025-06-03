import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../css/PedidosScreen.css';
import { ArrowLeft } from 'react-feather';

interface ProductDetails {
  _id: string;
  nombre: string;
  precio: number;
  images: string[];
}

interface PedidoDetalle {
  id_producto: ProductDetails;
  cantidad: number;
}

interface Repartidor {
  _id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  ubicacion?: string;
}

interface Pedido {
  _id: string;
  id_cliente: {
    _id: string;
    nombre: string;
    apellido: string;
  };
  id_restaurant: {
    _id: string;
    nombre: string;
    ubicacion: string;
  };
  id_repartidor?: string;
  estado: string;
  total: number;
  direccion_de_entrega: string;
  detalles: PedidoDetalle[];
  createdAt: string;
  confirmado_por_cliente?: boolean;
  confirmado_por_repartidor?: boolean;
}

const map: Record<string, string> = {
  'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
  'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
  ' ': '-'
};

const normalizarClaseEstado = (estado: string): string =>
  estado.toLowerCase().replace(/[áéíóúÁÉÍÓÚ ]/g, (c) => map[c] || '');

const PedidoDetailsScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [repartidor, setRepartidor] = useState<Repartidor | null>(null);
  const tiempoPreparacion = 15;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const { data } = await axios.get(`https://rikoapi.onrender.com/api/pedido/pedidos/${id}`);
        setPedido(data);
        if (data.id_repartidor) {
          const res = await axios.get(`https://rikoapi.onrender.com/api/repartidor/repartidor/${data.id_repartidor}`);
          setRepartidor(res.data);
        }
      } catch (error) {
        console.error('Error al obtener el pedido:', error);
      }
    };
    fetchPedido();
  }, [id]);

  const handleCancelarPedido = async () => {
    if (!pedido) return;
    try {
      await axios.put(`https://rikoapi.onrender.com/api/pedido/pedidos/${pedido._id}/cancelar`);
      alert('Pedido cancelado con éxito');
      navigate('/pedidos');
    } catch (err: any) {
      alert('Error al cancelar pedido: ' + (err.response?.data || err.message));
    }
  };

  const handleConfirmarEntregaCliente = async () => {
    if (!pedido) return;
    try {
      await axios.put(`https://rikoapi.onrender.com/api/pedido/pedidos/${pedido._id}/entregado`, {
        quien_confirma: 'cliente',
      });
      alert('Pedido confirmado');
      window.location.reload();
    } catch (err: any) {
      alert('Error al confirmar entrega: ' + (err.response?.data || err.message));
    }
  };

  if (!pedido) return <div className="empty-text">Cargando detalles del pedido...</div>;

  const restaurantUbicacion = pedido.id_restaurant.ubicacion;
  const direccionCliente = pedido.direccion_de_entrega;

  const mapUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyD82sqA8El38A6ihIFT73xZr3ek7cbMxLg&origin=${restaurantUbicacion}&destination=${direccionCliente}&mode=driving`;

  return (
    <div className="pedidos-screen">
      <button onClick={() => navigate(-1)} className="back-button">
        <ArrowLeft size={20} />
      </button>
      <h2 className="titulo-pedidos">Detalles</h2>

      <div className="pedido-card">
        <div className="pedido-header">
          <h3>{pedido.id_restaurant?.nombre || 'Restaurante desconocido'}</h3>
          <span className={`estado estado-${normalizarClaseEstado(pedido.estado)}`}>
            {pedido.estado}
          </span>
        </div>

        <p>Pedido: <strong>{pedido._id}</strong></p>
        <p><strong>Total:</strong> ${pedido.total.toFixed(2)}</p>
        <p><strong>Dirección:</strong> {pedido.direccion_de_entrega}</p>
        <p><strong>Fecha:</strong> {new Date(pedido.createdAt).toLocaleString()}</p>
        <p><strong>Tiempo de preparación:</strong> {tiempoPreparacion} min</p>

        <div className="map-container" style={{ height: '300px', width: '100%', margin: '1rem 0' }}>
          <iframe
            title="Mapa de ruta"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapUrl}
          ></iframe>
        </div>

        {repartidor && (
          <p><strong>Repartidor:</strong> {`${repartidor.nombre.split(' ')[0]} ${repartidor.apellido.split(' ')[0]}`}</p>
        )}

        <div className="pedido-productos">
          {pedido.detalles.map((detalle, index) => (
            <div key={index} className="pedido-item">
              <img
                src={detalle.id_producto?.images?.[0] || '/assets/images/default-product.png'}
                alt={detalle.id_producto?.nombre}
                className="pedido-img"
              />
              <div className="pedido-info">
                <span className="nombre-producto">{detalle.id_producto.nombre}</span>
                <span className="cantidad">Cantidad: {detalle.cantidad}</span>
                <span className="subtotal">Subtotal: ${(detalle.id_producto.precio * detalle.cantidad).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {pedido.estado === 'Pendiente' && (
          <button className="cancelar-pedido-button" onClick={handleCancelarPedido}>
            Cancelar Pedido
          </button>
        )}

        {pedido.estado === 'En camino a entregar' && (
          !pedido.confirmado_por_cliente ? (
            <button className="confirmar-pedido-button" onClick={handleConfirmarEntregaCliente}>
              He recibido mi pedido
            </button>
          ) : !pedido.confirmado_por_repartidor ? (
            <button className="confirmar-pedido-button" disabled>
              Por confirmar repartidor
            </button>
          ) : null
        )}
      </div>
    </div>
  );
};

export default PedidoDetailsScreen;