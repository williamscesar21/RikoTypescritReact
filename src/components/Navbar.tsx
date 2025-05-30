import { useEffect, useState, type JSX } from "react";
import { Link, useLocation } from "react-router-dom";
import '../css/Navbar.css';
import Cookies from 'js-cookie';
import {
  FaHome, FaStore,
  FaBoxOpen, FaShoppingBag, FaSignOutAlt
} from 'react-icons/fa';

interface NavItem {
  name: string;
  path: string;
  icon: JSX.Element;
}

const Navbar: React.FC = () => {
  const [activeList, setActiveList] = useState<number | null>(null);
  const location = useLocation();

  const paths: NavItem[] = [
    { name: "Inicio", path: "/", icon: <FaHome /> },
    { name: "Restaurantes", path: "/restaurants", icon: <FaStore /> },
    { name: "Bolsita", path: "/bolsita", icon: <FaShoppingBag /> },
    // { name: "Repartidores", path: "/repartidores", icon: <FaMotorcycle /> },
    { name: "Productos", path: "/productos", icon: <FaBoxOpen /> },
  ];

  useEffect(() => {
    const currentPath = location.pathname;
    const index = paths.findIndex(item => item.path === currentPath);

    if (index !== -1) {
      setActiveList(index);
      Cookies.set('activeList', index.toString());
    } else {
      const savedIndex = Cookies.get('activeList');
      if (savedIndex) {
        setActiveList(parseInt(savedIndex, 10));
      }
    }
  }, [location.pathname]);

  const handleItemClick = (index: number): void => {
    setActiveList(index);
    Cookies.set('activeList', index.toString());
  };

  const handleLogout = () => {
    const confirmed = window.confirm("¿Estás seguro de que deseas cerrar sesión?");
    if (confirmed) {
      localStorage.clear();
      Cookies.remove('activeList');
      window.location.reload();
    }
  };

  return (
    <div className="navbar-bottom">
      {paths.slice(0, 2).map((item, index) => (
        <Link className="bottom-link" to={item.path} key={index} onClick={() => handleItemClick(index)}>
          <div className={`bottom-item ${activeList === index ? 'active' : ''}`}>
            {item.icon}
          </div>
        </Link>
      ))}

      <Link to="/bolsita" className="center-button">
        <FaShoppingBag />
      </Link>

      {paths.slice(2).map((item, index) => (
        <Link className="bottom-link" to={item.path} key={index + 2} onClick={() => handleItemClick(index + 2)}>
          <div className={`bottom-item ${activeList === index + 2 ? 'active' : ''}`}>
            {item.icon}
          </div>
        </Link>
      ))}

      <button className="bottom-link logout-button" onClick={handleLogout}>
        <div className="bottom-item">
          <FaSignOutAlt />
        </div>
      </button>
    </div>

  );
};

export default Navbar;
