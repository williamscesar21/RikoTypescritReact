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
  id_restaurant?: string;
}

const ITEMS_PER_PAGE = 5;

const ProductList: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://rikoapi.onrender.com/api/product/product');
        setProducts(response.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
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

  const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
  const paginatedProducts = products.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const goToPrevious = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const goToNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  if (loading) return <div className="loading">Cargando productos...</div>;

  return (
    <>
      <div className="product-list animate-slide-in">
        {paginatedProducts.map((item) => (
          <div
            key={item._id}
            className="product-card"
            onClick={() => goToProductScreen(item._id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') goToProductScreen(item._id); }}
            style={{ cursor: 'pointer' }}
          >
            <img src={item.images[0]} alt={item.nombre} className="product-image" />
            <div className="product-info">
              <h3 className="product-title">{item.nombre}</h3>
              <p className="product-desc">{truncateDescription(item.descripcion)}</p>
              <div className="price-button-container" onClick={(e) => e.stopPropagation()}>
                <span className="product-price">${item.precio.toFixed(2)}</span>
                <BotonAgregar onAgregar={() => openModal(item)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {products.length > ITEMS_PER_PAGE && (
        <div className="pagination-controls">
          <button style={{display: 'none'}} onClick={goToPrevious} disabled={currentPage === 1}>Anterior</button>
          <span style={{display: 'none'}}>Página {currentPage} de {totalPages}</span>
          <button style={{display: 'none'}} onClick={goToNext} disabled={currentPage === totalPages}>Siguiente</button>
        </div>
      )}

      {selectedProduct && (
        <ModalAgregarProducto
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedProduct(null);
          }}
          item={{
            ...selectedProduct,
            id_restaurant: selectedProduct.id_restaurant || ''
          }}
        />
      )}
    </>
  );
};

export default ProductList;
