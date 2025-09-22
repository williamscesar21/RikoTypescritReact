import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../css/ProductList.css';
import BotonAgregar from './BotonAgregar';
import ModalAgregarProducto from './ModalAgregarProducto';

interface Product {
  _id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  images: string[];
  id_restaurant: string;
  suspendido?: boolean;
}

interface Restaurant {
  _id: string;
  suspendido?: boolean;
  horario_de_trabajo: { dia: string; inicio: string; fin: string }[];
}

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restaurantOpenMap, setRestaurantOpenMap] = useState<Record<string, boolean>>({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductsAndRestaurants = async () => {
      try {
        const { data: allProducts } = await axios.get<Product[]>(
          'https://rikoapi.onrender.com/api/product/product'
        );

        const uniqueRestaurantIds = [...new Set(allProducts.map((p) => p.id_restaurant))];

        const restaurantsData = await Promise.all(
          uniqueRestaurantIds.map(async (id) => {
            try {
              const { data } = await axios.get<Restaurant>(
                `https://rikoapi.onrender.com/api/restaurant/restaurant/${id}`
              );

              let isOpen = false;
              if (data.horario_de_trabajo) {
                const now = new Date();
                const day = now.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
                const currentTime = now.getHours() * 100 + now.getMinutes();

                const today = data.horario_de_trabajo.find(
                  (d) => d.dia.toLowerCase() === day
                );
                if (today) {
                  const open = parseInt(today.inicio.replace(':', ''));
                  const close = parseInt(today.fin.replace(':', ''));
                  isOpen = currentTime >= open && currentTime <= close;
                }
              }

              return { id, suspendido: data.suspendido ?? false, abierto: isOpen };
            } catch (error) {
              console.error(`Error obteniendo restaurante ${id}`, error);
              return { id, suspendido: true, abierto: false };
            }
          })
        );

        const restaurantMap: Record<string, boolean> = {};
        const openMap: Record<string, boolean> = {};
        restaurantsData.forEach((r) => {
          restaurantMap[r.id] = r.suspendido;
          openMap[r.id] = r.abierto;
        });

        setRestaurantOpenMap(openMap);

        const filteredProducts = allProducts.filter(
          (p) =>
            (p.suspendido === false || p.suspendido === undefined) &&
            restaurantMap[p.id_restaurant] === false
        );

        // 👉 tomar solo los primeros 10 (los "mejores" según orden recibido)
        setProducts(filteredProducts.slice(0, 10));
      } catch (error) {
        console.error('Error fetching products or restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndRestaurants();
    const interval = setInterval(fetchProductsAndRestaurants, 1000);

    return () => clearInterval(interval); // limpiar intervalo al desmontar
    
  }, []);

  const truncateDescription = (description: string) => {
    const words = description.split(' ');
    return words.length > 5 ? words.slice(0, 5).join(' ') + '...' : description;
  };

  const goToProductScreen = (id: string) => {
    navigate(`/product/${id}`);
  };

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  if (loading) return <div className="loading">Cargando productos...</div>;

  return (
    <>
      <div className="product-list animate-slide-in">
        {products.map((item) => {
          const isOpen = restaurantOpenMap[item.id_restaurant];

          return (
            <div
              key={item._id}
              className="product-card"
              onClick={() => goToProductScreen(item._id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') goToProductScreen(item._id);
              }}
              style={{ cursor: 'pointer' }}
            >
              <img
                src={item.images[0]}
                alt={item.nombre}
                className="product-image"
              />
              <div className="product-info">
                <h3 className="product-title">{item.nombre}</h3>
                <p className="product-desc">{truncateDescription(item.descripcion)}</p>
                <div
                  className="price-button-container"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="product-price">${item.precio.toFixed(2)}</span>
                  {isOpen ? (
                    <BotonAgregar onAgregar={() => openModal(item)} />
                  ) : (
                    <span className="closed-label">Cerrado</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProduct && (
        <ModalAgregarProducto
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProduct(null);
          }}
          item={{
            ...selectedProduct,
            id_restaurant: selectedProduct.id_restaurant || '',
          }}
        />
      )}
    </>
  );
};

export default ProductList;
