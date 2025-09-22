import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2 } from 'react-feather';
import '../css/CartScreen.css';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from "../firebase";

interface ProductDetails {
  _id: string;
  nombre: string;
  precio: number;
  images: string[];
}

interface CartItem {
  product: string;
  quantity: number;
  productDetails: ProductDetails;
  id_restaurant: string;
}

interface Cart {
  _id: string;
  id_client: string;
  total: number;
  items: CartItem[];
}

interface PagoMovil {
  telefono: string;
  cedula: string;
  banco: string;
  nombreBanco: string;
}

interface RestaurantMeta {
  nombre: string;
  ubicacion: string;
  horario: { dia: string; inicio: string; fin: string }[];
}

function getDistanceKm(coord1: string, coord2: string): number {
  const [lat1, lon1] = coord1.split(',').map(Number);
  const [lat2, lon2] = coord2.split(',').map(Number);
  const R = 6371;
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

const CartScreen: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [restaurantCoords, setRestaurantCoords] = useState<Record<string, string>>({});
  const [restaurantMeta, setRestaurantMeta] = useState<Record<string, RestaurantMeta>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [pagoMovilData, setPagoMovilData] = useState<PagoMovil | null>(null);
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  const [currentItems, setCurrentItems] = useState<CartItem[]>([]);
  const [isPaying, setIsPaying] = useState(false);

  const navigate = useNavigate();
  const clientId = localStorage.getItem('clientId');
  const userCoords = localStorage.getItem('userLocation');

  const handlePlaceOrder = async (restaurantId: string, items: CartItem[]) => {
    if (!clientId) return;
    try {
      const { data: restaurant } = await axios.get(
        `https://rikoapi.onrender.com/api/restaurant/restaurant/${restaurantId}`
      );

      if (!restaurant.pagoMovil) {
        alert('El restaurante no tiene datos de Pago Móvil configurados.');
        return;
      }

      setPagoMovilData(restaurant.pagoMovil);
      setCurrentRestaurantId(restaurantId);
      setCurrentItems(items);
      setShowModal(true);
    } catch (error: any) {
      console.error('Error al obtener datos de Pago Móvil:', error.response?.data || error.message);
    }
  };

  
  const isRestaurantOpen = (restaurantId: string): boolean => {
    const rest = restaurantMeta[restaurantId];
    if (!rest || !rest.horario) return false;

    const now = new Date();
    const day = now.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const today = rest.horario.find((d) => d.dia.toLowerCase() === day);
    if (today) {
      const open = parseInt(today.inicio.replace(':', ''));
      const close = parseInt(today.fin.replace(':', ''));
      return currentTime >= open && currentTime <= close;
    }
    return false;
  };

  const confirmPayment = async () => {
    if (!clientId || !userCoords || !currentRestaurantId || !currentItems) return;
    try {
      setIsPaying(true);
      const detalles = currentItems.map((item) => ({
        id_producto: item.product,
        cantidad: item.quantity,
      }));

      const subtotal = currentItems.reduce(
        (acc, item) => acc + item.productDetails.precio * item.quantity,
        0
      );

      const factorCorrecionRuta = 1.3;
      const deliveryFee =
        userCoords && restaurantCoords[currentRestaurantId]
          ? 1.5 +
            getDistanceKm(userCoords, restaurantCoords[currentRestaurantId]) *
              factorCorrecionRuta *
              0.5
          : subtotal * 0.1 + 1.5;
      const total = subtotal + deliveryFee;

      const payload = {
        id_cliente: clientId,
        id_restaurant: currentRestaurantId,
        direccion_de_entrega: userCoords,
        detalles,
        total,
      };

      const response = await axios.post('https://rikoapi.onrender.com/api/pedido/pedidos', payload);
      const orderId = response.data.id;
      if (!orderId) throw new Error("El backend no devolvió un orderId válido");

      await setDoc(doc(db, "RikoChat", orderId), {
        orderId,
        clientId,
        restaurantId: currentRestaurantId,
        repartidorId: null,
        createdAt: serverTimestamp(),
      });

      const mapsUrl = `https://www.google.com/maps?q=${userCoords}`;
      await addDoc(collection(db, "RikoChat", orderId, "messages"), {
        senderId: clientId,
        senderType: "client",
        content: mapsUrl,
        type: "location",
        timestamp: serverTimestamp(),
      });

      for (const item of currentItems) {
        if (item.id_restaurant === currentRestaurantId) {
          await axios.post('https://rikoapi.onrender.com/api/cart/cart/remove', {
            productId: item.product,
            clientId,
          });
        }
      }

      setCart((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((item) => item.id_restaurant !== currentRestaurantId),
            }
          : prev
      );

      setShowModal(false);
      setPagoMovilData(null);
      setCurrentRestaurantId(null);
      setCurrentItems([]);
      setIsPaying(false);
      navigate(`/chat/${orderId}`);
    } catch (error: any) {
      console.error('Error al generar pedido:', error.response?.data || error.message);
      alert('Error al generar el pedido');
      setShowModal(false);
    }
  };

useEffect(() => {
  if (!clientId) {
    setLoading(false);
    return;
  }

  const fetchCart = async () => {
    try {
      const { data: cartData } = await axios.get<Cart>(
        `https://rikoapi.onrender.com/api/cart/cart/${clientId}`
      );

      const itemsWithDetails = await Promise.all(
        cartData.items.map(async (item) => {
          try {
            const { data: product } = await axios.get(
              `https://rikoapi.onrender.com/api/product/product/${item.product}`
            );
            return { ...item, productDetails: product };
          } catch {
            return {
              ...item,
              productDetails: {
                _id: '',
                nombre: 'Producto no disponible',
                precio: 0,
                images: [],
              },
            };
          }
        })
      );

      setCart({ ...cartData, items: itemsWithDetails });
      await fetchRestaurantMeta(itemsWithDetails);
    } catch (error: any) {
      console.error('Error al obtener el carrito:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestaurantMeta = async (items: CartItem[]) => {
    const uniqueIds = [...new Set(items.map((item) => item.id_restaurant))];
    const meta: Record<string, RestaurantMeta> = {};
    const coords: Record<string, string> = {};

    await Promise.all(
      uniqueIds.map(async (id) => {
        try {
          const { data } = await axios.get(
            `https://rikoapi.onrender.com/api/restaurant/restaurant/${id}`
          );
          meta[id] = {
            nombre: data.nombre || `Restaurante ${id.slice(-4)}`,
            ubicacion: data.ubicacion || '',
            horario: data.horario_de_trabajo || [],
          };
          coords[id] = data.ubicacion || '';
        } catch {
          meta[id] = {
            nombre: `Restaurante ${id.slice(-4)}`,
            ubicacion: '',
            horario: [],
          };
          coords[id] = '';
        }
      })
    );

    setRestaurantMeta(meta);
    setRestaurantCoords(coords);
  };

  // 🚀 Ejecutar cada 1s
  fetchCart(); // primera ejecución inmediata
  const intervalId = setInterval(fetchCart, 1000);

  return () => clearInterval(intervalId); // limpiar al desmontar
}, [clientId]);


  const handleAddToCart = async (item: CartItem, quantityChange: number) => {
    if (!clientId) return;
    try {
      await axios.post('https://rikoapi.onrender.com/api/cart/add', {
        productId: item.product,
        quantity: quantityChange,
        client: { _id: clientId },
        id_restaurant: item.id_restaurant,
      });

      setCart((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items
                .map((i) =>
                  i.product === item.product
                    ? { ...i, quantity: i.quantity + quantityChange }
                    : i
                )
                .filter((i) => i.quantity > 0),
            }
          : prev
      );
    } catch (error: any) {
      console.error('Error al actualizar carrito:', error.response?.data || error.message);
    }
  };

  const handleRemove = async (item: CartItem) => {
    if (!clientId) return;
    try {
      await axios.post('https://rikoapi.onrender.com/api/cart/cart/remove', {
        productId: item.product,
        clientId,
      });
      setCart((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((i) => i.product !== item.product),
            }
          : prev
      );
    } catch (error: any) {
      console.error('Error al eliminar producto:', error.response?.data || error.message);
    }
  };

  const groupByRestaurant = (items: CartItem[]) => {
    const grouped: { [id_restaurant: string]: CartItem[] } = {};
    items.forEach((item) => {
      if (!grouped[item.id_restaurant]) grouped[item.id_restaurant] = [];
      grouped[item.id_restaurant].push(item);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <img src="/logoNaranja.png" alt="loading" className="loading-image" />
        <p className="loading-text">Cargando...</p>
      </div>
    );
  }

  const groupedItems = cart ? groupByRestaurant(cart.items) : {};

  return (
    <div className="cart-screen">
      <div className="cart-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
        </button>
        <h1 className="cart-title">Bolsita de compra</h1>
      </div>

      {cart && cart.items.length === 0 && (
        <div className="empty-cart-message">
          <p>Tu carrito está vacío.</p>
          <button onClick={() => navigate('/restaurants')} className="browse-button">
            Explorar restaurantes
          </button>
        </div>
      )}

      {Object.entries(groupedItems).map(([restaurantId, items]) => {
        const subtotal = items.reduce(
          (acc, item) => acc + item.productDetails.precio * item.quantity,
          0
        );
        const factorCorrecionRuta = 0.8;
        const deliveryFee =
          userCoords && restaurantCoords[restaurantId]
            ? 0.8 +
              getDistanceKm(userCoords, restaurantCoords[restaurantId]) *
                factorCorrecionRuta *
                0.5
            : subtotal * 0.05 + 1.5;
        const total = subtotal + deliveryFee;

        return (
          <div key={restaurantId} className="restaurant-cart-section">
            <h2 className="restaurant-title-cart">
              {restaurantMeta[restaurantId]?.nombre || `Restaurante ${restaurantId.slice(-4)}`}
            </h2>

            <div className="items-list">
              {items.map((item, index) => (
                <div key={item.product + index} className="cart-item">
                  <div className="item-left">
                    <img
                      src={item.productDetails.images[0] || '/assets/images/default-product.png'}
                      alt={item.productDetails.nombre}
                      className="item-image"
                    />
                  </div>
                  <div className="item-center">
                    <div
                      className="item-name"
                      onClick={() => navigate(`/product/${item.product}`)}
                    >
                      {item.productDetails.nombre}
                    </div>
                    <div className="item-details">
                      <span className="item-quantity">{item.quantity}</span>
                      <span className="item-price">
                        ${(item.productDetails.precio * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="item-right">
                    <span onClick={() => handleAddToCart(item, -1)} className="circle-button-cart">
                      <Minus size={16} />
                    </span>
                    <span onClick={() => handleAddToCart(item, 1)} className="circle-button-cart">
                      <Plus size={16} />
                    </span>
                    <span onClick={() => handleRemove(item)} className="remove-button-cart">
                      <Trash2 size={16} />
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Sub total</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Delivery fee</span>
                <span>${deliveryFee.toFixed(2)}</span>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {!isRestaurantOpen(restaurantId) ? (
                <span className="closed-label" style={{ textAlign: 'center', marginTop: '10px' }}>
                  Restaurante Cerrado
                </span>
              ) : (
                <button
                  onClick={() => handlePlaceOrder(restaurantId, items)}
                  className="place-order-button"
                  disabled={items.length === 0}
                >
                  PAGAR
                </button>
              )}
            </div>
          </div>
        );
      })}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Datos de Pago Móvil</h2>
            {pagoMovilData ? (
              <div className="pago-movil-details">
                <p><strong>Teléfono:</strong> {pagoMovilData.telefono}</p>
                <p><strong>Documento:</strong> {pagoMovilData.cedula}</p>
                <p><strong>Banco:</strong> {pagoMovilData.nombreBanco} ({pagoMovilData.banco})</p>
                <p>
                  <strong>Total a pagar:</strong> {(() => {
                    const totalUSD =
                      currentItems.reduce(
                        (acc, item) => acc + item.productDetails.precio * item.quantity,
                        0
                      ) +
                      (userCoords && currentRestaurantId && restaurantCoords[currentRestaurantId]
                        ? 0.8 +
                          getDistanceKm(userCoords, restaurantCoords[currentRestaurantId]) *
                            0.8 *
                            0.5
                        : currentItems.reduce(
                            (acc, item) => acc + item.productDetails.precio * item.quantity,
                            0
                          ) *
                            0.05 +
                          1.5);

                    const dolarEnBs = parseFloat(localStorage.getItem("dolarenbs") || "0");
                    const totalBs = dolarEnBs ? (totalUSD * dolarEnBs).toFixed(2) : "N/A";
                    return `$${totalUSD.toFixed(2)} | ${totalBs} Bs`;
                  })()}
                </p>
              </div>
            ) : (
              <p>No se encontraron datos de Pago Móvil.</p>
            )}
            <div className="modal-buttons">
              <button
                className="modal-cancel-button"
                onClick={() => {
                  setShowModal(false);
                  setPagoMovilData(null);
                  setCurrentRestaurantId(null);
                  setCurrentItems([]);
                }}
                disabled={isPaying}
              >
                Cancelar
              </button>
              <button
                className="modal-confirm-button"
                onClick={confirmPayment}
                disabled={!pagoMovilData || isPaying}
              >
                {isPaying ? "..." : "Ya Pagué"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartScreen;
