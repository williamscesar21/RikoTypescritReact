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

const CartScreen: React.FC = () => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const clientId = localStorage.getItem('clientId');

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
      } catch (error: any) {
        console.error('Error al obtener el carrito:', error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
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

  if (loading) {
    return (
      <div className="loading-container">
        <img src="/logoNaranja.png" alt="loading" className="loading-image" />
        <p className="loading-text">Cargando...</p>
      </div>
    );
  }

  const subtotal = cart?.items.reduce(
    (acc, item) => acc + item.productDetails.precio * item.quantity,
    0
  ) ?? 0;
  const deliveryFee = subtotal > 0 ? subtotal * 0.1 + 2 : 0;
  const total = subtotal + deliveryFee;

  return (
    <div className="cart-screen">
      <div className="cart-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
        </button>
        <h1 className="cart-title">Bolsita de compra</h1>
      </div>

      <div className="items-list">
        {cart?.items.length === 0 ? (
          <div className="empty-cart-inline">
            <p>No tienes productos en tu bolsita.</p>
          </div>
        ) : (
          cart?.items.map((item, index) => (
            <div key={item.product + index} className="cart-item">
              <div className="item-left">
                <img
                  src={item.productDetails.images[0] || '/assets/images/default-product.png'}
                  alt={item.productDetails.nombre}
                  className="item-image"
                />
              </div>

              <div className="item-center">
                <div className="item-name">{item.productDetails.nombre}</div>
                <div className="item-details">
                  <span className="item-quantity">{item.quantity} x</span>
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
          ))
        )}
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
          onClick={() => navigate('/order-preparing')}
          className="place-order-button"
          disabled={cart?.items.length === 0}
        >
          PLACE ORDER
        </button>
      </div>
    </div>
  );
};

export default CartScreen;
