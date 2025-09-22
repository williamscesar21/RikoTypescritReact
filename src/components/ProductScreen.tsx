import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../css/ProductScreen.css';
import { ArrowLeft } from 'react-feather';
import BotonAgregar from './BotonAgregar';
import ModalAgregarProducto from './ModalAgregarProducto';
import DishRow from './Dishrow';

interface Product {
  _id: string;
  nombre: string;
  descripcion: string;
  precio: number;
  images: string[];
  id_restaurant: string;
  tags: string[];
  suspendido: boolean;
  calificacion: {
    promedio: number;
    calificaciones: number[];
  };
}

interface Restaurant {
  _id: string;
  nombre: string;
  horario_de_trabajo: { dia: string; inicio: string; fin: string }[];
}

const ProductScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data } = await axios.get<Product>(`https://rikoapi.onrender.com/api/product/product/${id}`);
        setProduct(data);
        setSelectedImage(data.images[0]);

        // traer restaurante
        const restaurantData = await axios.get<Restaurant>(
          `https://rikoapi.onrender.com/api/restaurant/restaurant/${data.id_restaurant}`
        );
        setRestaurant(restaurantData.data);

        // Cargar todos los productos para comparar
        const all = await axios.get<Product[]>(`https://rikoapi.onrender.com/api/product/product`);
        const related = all.data
          .filter(
            (p) =>
              p._id !== data._id &&
              p.tags.some((tag) => data.tags.includes(tag)) &&
              !p.suspendido
          )
          .slice(0, 6);
        setRelatedProducts(related);
      } catch (err: any) {
        setError(err.message || 'Error al cargar el producto');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const isRestaurantOpen = (): boolean => {
    if (!restaurant || !restaurant.horario_de_trabajo) return false;
    const now = new Date();
    const day = now.toLocaleDateString('es-ES', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const today = restaurant.horario_de_trabajo.find(
      (d) => d.dia.toLowerCase() === day
    );
    if (today) {
      const open = parseInt(today.inicio.replace(':', ''));
      const close = parseInt(today.fin.replace(':', ''));
      return currentTime >= open && currentTime <= close;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <img src="/logoNaranja.png" alt="loading" />
        <h2 style={{ color: 'black' }}>Cargando...</h2>
      </div>
    );
  }

  if (error || !product) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <>
      <div className="product-container">
        <div className="image-container">
          <img
            src={selectedImage || 'https://via.placeholder.com/600x400'}
            alt="Producto"
            className="main-image"
          />
          <button onClick={() => navigate(-1)} className="back-button">
            <ArrowLeft color="white" size={20} />
          </button>
        </div>

        <div className="info-container">
          <div className="thumbnail-row">
            {product.images.map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Producto ${index}`}
                onClick={() => setSelectedImage(img)}
                className={`thumbnail ${selectedImage === img ? 'selected' : ''}`}
              />
            ))}
          </div>

          <h1 className="product-name">{product.nombre}</h1>
          {restaurant && (
            <h4
              onClick={() => navigate(`/restaurant/${restaurant._id}`)}
              className="restaurant-name"
              style={{ color: 'gray', textAlign: 'center', margin: '0px', cursor: 'pointer' }}
            >
              {restaurant.nombre}
            </h4>
          )}

          {product.calificacion && (
            <div className="product-rating">
              {product.calificacion.promedio > 0 ? (
                <span>
                  ⭐ {product.calificacion.promedio.toFixed(1)} (
                  {product.calificacion.calificaciones.length})
                </span>
              ) : (
                <span className="no-rating">Sin calificación</span>
              )}
            </div>
          )}

          <div className="price-and-counter">
            <span className="price">${product.precio.toFixed(2)}</span>
            {isRestaurantOpen() ? (
              <BotonAgregar onAgregar={() => openModal(product)} />
            ) : (
              <span className="closed-label">Cerrado</span>
            )}
          </div>

          {product.tags?.length > 0 && (
            <div className="product-tags">
              {product.tags.map((tag, index) => (
                <span key={index} className="tag-pill">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h2 className="description-title">Descripción</h2>
          <p className="description">{product.descripcion}</p>
        </div>

        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2 className="description-title">Productos similares</h2>
            <div className="related-list">
              {relatedProducts.map((item) => (
                <DishRow item={item} key={item._id} />
              ))}
            </div>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ModalAgregarProducto
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProduct(null);
          }}
          item={{
            _id: selectedProduct._id,
            nombre: selectedProduct.nombre,
            precio: selectedProduct.precio,
            id_restaurant: selectedProduct.id_restaurant,
          }}
        />
      )}
    </>
  );
};

export default ProductScreen;
