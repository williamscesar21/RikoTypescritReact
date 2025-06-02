import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, Trash2 } from 'react-feather';
import '../css/CartScreen.css';

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

function getDistanceKm(coord1: string, coord2: string): number {
  const [lat1, lon1] = coord1.split(',').map(Number);
  const [lat2, lon2] = coord2.split(',').map(Number);
  const R = 6371; // km

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
  const [restaurantNames, setRestaurantNames] = useState<Record<string, string>>({});
  const [restaurantCoords, setRestaurantCoords] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const clientId = localStorage.getItem('clientId');
  const userCoords = localStorage.getItem('userLocation');

  const handlePlaceOrder = async (restaurantId: string, items: CartItem[]) => {
    if (!clientId || !userCoords || !restaurantCoords[restaurantId]) return;

    try {
      const detalles = items.map((item) => ({
        id_producto: item.product,
        cantidad: item.quantity,
      }));

      const subtotal = items.reduce(
        (acc, item) => acc + item.productDetails.precio * item.quantity,
        0
      );

      const distanceKm = getDistanceKm(userCoords, restaurantCoords[restaurantId]);
      const deliveryFee = 2 + distanceKm * 0.5;
      const total = subtotal + deliveryFee;

      const payload = {
        id_cliente: clientId,
        id_restaurant: restaurantId,
        direccion_de_entrega: userCoords,
        detalles,
        total,
      };

      await axios.post('https://rikoapi.onrender.com/api/pedido/pedidos', payload);

      await Promise.all(
        items.map((item) =>
          axios.post('https://rikoapi.onrender.com/api/cart/cart/remove', {
            productId: item.product,
            clientId,
          })
        )
      );

      setCart((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((item) => item.id_restaurant !== restaurantId),
            }
          : prev
      );

      alert('Pedido generado con éxito');
      navigate(`/pedidos`);
    } catch (error: any) {
      console.error('Error al generar pedido:', error.response?.data || error.message);
      alert('Error al generar el pedido');
    }
  };

  useEffect(() => {
    if (!clientId) {
      console.error('Cliente no autenticado');
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
      const names: Record<string, string> = {};
      const coords: Record<string, string> = {};

      await Promise.all(
        uniqueIds.map(async (id) => {
          try {
            const { data } = await axios.get(
              `https://rikoapi.onrender.com/api/restaurant/restaurant/${id}`
            );
            names[id] = data.nombre || `Restaurante ${id.slice(-4)}`;
            coords[id] = data.ubicacion || '';
          } catch {
            names[id] = `Restaurante ${id.slice(-4)}`;
            coords[id] = '';
          }
        })
      );

      setRestaurantNames(names);
      setRestaurantCoords(coords);
    };

    fetchCart();
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

      {Object.entries(groupedItems).map(([restaurantId, items]) => {
        const subtotal = items.reduce(
          (acc, item) => acc + item.productDetails.precio * item.quantity,
          0
        );
        const factorCorrecionRuta = 1.30; // ~50% más que en línea recta
        const deliveryFee =
          userCoords && restaurantCoords[restaurantId]
            ? 1.5 + getDistanceKm(userCoords, restaurantCoords[restaurantId]) * factorCorrecionRuta * 0.5
            : subtotal * 0.1 + 1.5; // fallback
        ;
        const total = subtotal + deliveryFee;

        return (
          <div key={restaurantId} className="restaurant-cart-section">
            <h2 className="restaurant-title-cart">
              {restaurantNames[restaurantId] || `Restaurante ${restaurantId.slice(-4)}`}
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
                    <div className="item-name" onClick={() => navigate(`/product/${item.product}`)}>
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
              <button
                onClick={() => handlePlaceOrder(restaurantId, items)}
                className="place-order-button"
                disabled={items.length === 0}
              >
                PLACE ORDER
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CartScreen;
