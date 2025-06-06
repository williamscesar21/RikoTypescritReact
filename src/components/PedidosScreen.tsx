import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
}

interface Pedido {
  _id: string;
  id_cliente: {
    _id: string;
    nombre: string;
    apellido: string;
    email?: string;
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

const PedidosScreen: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [repartidores, setRepartidores] = useState<Record<string, Repartidor>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const clientId = localStorage.getItem('clientId');

  const map: Record<string, string> = {
    'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u',
    'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ú': 'u',
    ' ': '-'
  };

  const prioridadEstado: Record<string, number> = {
    'Pendiente': 1,
    'En preparación': 2,
    'En camino a recoger': 3,
    'En camino a entregar': 4,
    'Entregado': 5,
    'Cancelado': 6,
    'Rechazado': 7,
  };

  const normalizarClaseEstado = (estado: string): string =>
    estado.toLowerCase().replace(/[áéíóúÁÉÍÓÚ ]/g, (c) => map[c] || '');

  const calcularTiempoEstimado = (direccionCliente: string, direccionRestaurante: string): string => {
    const userCoords = direccionCliente;
    const restaurantCoords = direccionRestaurante; 

    const [lat1, lon1] = userCoords.split(',').map(Number);
    const [lat2, lon2] = restaurantCoords.split(',').map(Number);
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanciaKm = R * c;

    const velocidadPromedio = 30; // km/h
    const tiempoPreparacion = 15; // minutos

    const tiempoHoras = distanciaKm / velocidadPromedio;
    const tiempoEntrega = Math.ceil(tiempoHoras * 60);
    const tiempoTotal = tiempoPreparacion + tiempoEntrega;
    return `${tiempoTotal} min aprox.`;
  };

  const handleCancelarPedido = async (idPedido: string) => {
    try {
      await axios.put(`https://rikoapi.onrender.com/api/pedido/pedidos/${idPedido}/cancelar`);
      alert('Pedido cancelado con éxito');
      setPedidos(prev => prev.filter(p => p._id !== idPedido));
    } catch (error: any) {
      console.error('Error al cancelar pedido:', error.response?.data || error.message);
      alert('No se pudo cancelar el pedido');
    }
  };

  const handleConfirmarEntregaCliente = async (idPedido: string) => {
    try {
      await axios.put(`https://rikoapi.onrender.com/api/pedido/pedidos/${idPedido}/entregado`, {
        quien_confirma: 'cliente',
      });
      alert('Confirmación enviada');
      fetchPedidos();
    } catch (error: any) {
      console.error('Error al confirmar entrega:', error.response?.data || error.message);
      alert('No se pudo confirmar la entrega');
    }
  };

  const cargarRepartidor = async (id: string) => {
    if (repartidores[id]) return;
    try {
      const { data } = await axios.get<Repartidor>(`https://rikoapi.onrender.com/api/repartidor/repartidor/${id}`);
      setRepartidores(prev => ({ ...prev, [id]: data }));
    } catch (error) {
      console.warn('No se pudo obtener el repartidor:', id);
    }
  };

  const fetchPedidos = async () => {
    if (!clientId) {
      console.warn('Usuario no autenticado');
      setLoading(false);
      return;
    }

    try {
      const { data } = await axios.get<Pedido[]>(
        `https://rikoapi.onrender.com/api/pedido/pedidos/cliente/${clientId}`
      );
      setPedidos(data);

      const idsUnicos = Array.from(new Set(data.map(p => p.id_repartidor).filter(Boolean)));
      idsUnicos.forEach((id) => cargarRepartidor(id as string));
    } catch (error: any) {
      console.error('Error al obtener pedidos:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPedidos();
    const interval = setInterval(fetchPedidos, 10000); // cada 10 segundos
    return () => clearInterval(interval);
  }, [clientId]);

  if (loading) return <div className="loading-text">Cargando pedidos...</div>;
  if (pedidos.length === 0) return <div className="empty-text">No tienes pedidos pendientes.</div>;

  return (
    <div className="pedidos-screen">
      <button onClick={() => navigate(-1)} className="back-button">
        <ArrowLeft size={20} />
      </button>
      <h2 className="titulo-pedidos">Mis Pedidos</h2>

      {[...pedidos]
        .sort((a, b) => prioridadEstado[a.estado] - prioridadEstado[b.estado])
        .map((pedido) => (
          <div key={pedido._id} className="pedido-card">
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
            <p><strong>Tiempo estimado de llegada:</strong> {calcularTiempoEstimado(pedido.direccion_de_entrega, pedido.id_restaurant?.ubicacion)}</p>

            {pedido.id_repartidor && (
              <p>
                <strong>Repartidor:</strong>{' '}
                {(() => {
                  const nombreCompleto = repartidores[pedido.id_repartidor]?.nombre;
                  const apellidoCompleto = repartidores[pedido.id_repartidor]?.apellido;
                  if (!nombreCompleto) return 'Aún no asignado';
                  const primerNombre = nombreCompleto.split(' ')[0];
                  const primerApellido = apellidoCompleto.split(' ')[0];
                //   const telefono = repartidores[pedido.id_repartidor]?.telefono;
                  return (
                    <>
                      {primerNombre}{' '}{primerApellido}
                      {/* {telefono ? (
                        <a href={`tel:${telefono}`}>({telefono})</a>
                      ) : (
                        '(Teléfono no disponible)'
                      )} */}
                    </>
                  );
                })()}
              </p>
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
                    <span className="nombre-producto">{detalle.id_producto?.nombre}</span>
                    <span className="cantidad">Cantidad: {detalle.cantidad}</span>
                    <span className="subtotal">
                      Subtotal: ${(detalle.id_producto?.precio * detalle.cantidad).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {pedido.estado === 'Pendiente' && (
              <button
                onClick={() => handleCancelarPedido(pedido._id)}
                className="cancelar-pedido-button"
              >
                Cancelar Pedido
              </button>
            )}

            {pedido.estado === 'En camino a entregar' && (
              <>
                {!pedido.confirmado_por_cliente ? (
                  <button
                    onClick={() => handleConfirmarEntregaCliente(pedido._id)}
                    className="confirmar-pedido-button"
                  >
                    He recibido mi pedido
                  </button>
                ) : !pedido.confirmado_por_repartidor ? (
                  <button className="confirmar-pedido-button" disabled>
                    Por confirmar repartidor
                  </button>
                ) : null}
              </>
            )}
            <span className='vermasbutton' onClick={()=> window.location.href = `/pedido/${pedido._id}`}>Ver más</span>
          </div>
        ))}
    </div>
  );
};

export default PedidosScreen;