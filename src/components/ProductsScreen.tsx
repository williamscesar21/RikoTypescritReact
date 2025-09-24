import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiFilter } from "react-icons/fi"; 
import "../css/ProductsScreen.css";
import BotonAgregar from "./BotonAgregar";
import ModalAgregarProducto from "./ModalAgregarProducto";
import { ArrowLeft } from "react-feather";

interface Product {
  _id: string;
  nombre: string;
  precio: number;
  descripcion: string;
  images: string[];
  id_restaurant: string;
  suspendido?: boolean;
  tags?: string[];
  calificacion?: {
    promedio: number;
    calificaciones: number[];
  };
}

interface Restaurant {
  _id: string;
  suspendido?: boolean;
  horario_de_trabajo?: { dia: string; inicio: string; fin: string }[];
}

const ProductsScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [restaurantOpenMap, setRestaurantOpenMap] = useState<Record<string, boolean>>({});
  const [sortOption, setSortOption] = useState<string>("recomendados");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [search, setSearch] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchProductsAndRestaurants = async () => {
      try {
        const { data: allProducts } = await axios.get<Product[]>(
          "https://rikoapi.onrender.com/api/product/product"
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
                const day = now.toLocaleDateString("es-ES", { weekday: "long" }).toLowerCase();
                const currentTime = now.getHours() * 100 + now.getMinutes();

                const today = data.horario_de_trabajo.find(
                  (d) => d.dia.toLowerCase() === day
                );
                if (today) {
                  const open = parseInt(today.inicio.replace(":", ""));
                  const close = parseInt(today.fin.replace(":", ""));
                  isOpen = currentTime >= open && currentTime <= close;
                }
              }

              return { id, suspendido: data.suspendido ?? false, abierto: isOpen };
            } catch {
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

        const filtered = allProducts.filter(
          (p) =>
            (p.suspendido === false || p.suspendido === undefined) &&
            restaurantMap[p.id_restaurant] === false
        );

        setProducts(filtered);

        // Extraer tags únicos
        const allTags = Array.from(new Set(filtered.flatMap((p) => p.tags || [])));
        setTags(allTags);
      } catch (error) {
        console.error("Error fetching products or restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    // 🔹 Llamada inicial
    fetchProductsAndRestaurants();

    // 🔹 Intervalo cada 1 segundo
    const interval = setInterval(fetchProductsAndRestaurants, 1000);

    return () => clearInterval(interval); // limpiar al desmontar
  }, []);

  useEffect(() => {
    let sorted = [...products];

    if (search) {
      sorted = sorted.filter((p) =>
        p.nombre.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (selectedTag) {
      sorted = sorted.filter((p) => p.tags?.includes(selectedTag));
    }

    switch (sortOption) {
      case "precio_asc":
        sorted.sort((a, b) => a.precio - b.precio);
        break;
      case "precio_desc":
        sorted.sort((a, b) => b.precio - a.precio);
        break;
      case "calificacion":
        sorted.sort(
          (a, b) => (b.calificacion?.promedio || 0) - (a.calificacion?.promedio || 0)
        );
        break;
      case "recomendados":
      default:
        sorted.sort(
          (a, b) =>
            (b.calificacion?.calificaciones?.length || 0) -
            (a.calificacion?.calificaciones?.length || 0)
        );
        break;
    }

    setFilteredProducts(sorted);
  }, [products, sortOption, selectedTag, search]);

  const goToProductScreen = (id: string) => {
    navigate(`/product/${id}`);
  };

  const openModal = (product: Product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  if (loading) return <div className="loading">Cargando productos...</div>;

  return (
    <div className="products-screen">
      <button onClick={() => navigate(-1)} className="back-button">
        <ArrowLeft color="white" size={20} />
      </button>
      <h1 className="title">Explora Productos</h1>

      {/* 🔍 Barra búsqueda + filtro */}
      <div className="search-filter-container">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button className="filter-button" onClick={() => setShowFilters(!showFilters)}>
          <FiFilter size={20} />
        </button>
      </div>

      {showFilters && (
        <div className="filters">
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
            <option value="recomendados">Recomendados</option>
            <option value="precio_asc">Precio: Menor a Mayor</option>
            <option value="precio_desc">Precio: Mayor a Menor</option>
            <option value="calificacion">Mejor Calificados</option>
          </select>
        </div>
      )}

      {tags.length > 0 && (
        <div className="tags-container">
          <button
            className={`tag-button ${selectedTag === "" ? "active" : ""}`}
            onClick={() => setSelectedTag("")}
          >
            Todos
          </button>
          {tags.map((tag, idx) => (
            <button
              key={idx}
              className={`tag-button ${selectedTag === tag ? "active" : ""}`}
              onClick={() => setSelectedTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <div className="products-grid">
        {filteredProducts.map((item) => {
          const isOpen = restaurantOpenMap[item.id_restaurant];
          return (
            <div
              key={item._id}
              className="product-card"
              onClick={() => goToProductScreen(item._id)}
            >
              <img src={item.images[0]} alt={item.nombre} className="product-image" />
              <div className="product-info">
                <h3>{item.nombre}</h3>
                <span className="rating">
                  {item.calificacion?.promedio
                    ? `⭐ ${item.calificacion.promedio.toFixed(1)}`
                    : "Sin calificación"}
                </span>
                <p className="desc">
                  {item.descripcion.length > 50
                    ? item.descripcion.slice(0, 50) + "..."
                    : item.descripcion}
                </p>
                <div className="price-button-container">
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
            id_restaurant: selectedProduct.id_restaurant || "",
          }}
        />
      )}
    </div>
  );
};

export default ProductsScreen;
