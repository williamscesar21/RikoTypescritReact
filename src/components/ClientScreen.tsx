import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaCheck, FaTimesCircle, FaRegCopy } from "react-icons/fa";
import '../css/ClientScreen.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'react-feather';

interface Client {
  _id: string;
  nombre: string;
  apellido: string;
  location: string;
  telefono: string;
  email: string;
  estatus: string;
  suspendido: boolean;
  createdAt: string;
  updatedAt: string;
}

const ClientScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<Client | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const [editableFields, setEditableFields] = useState({
    nombre: '',
    apellido: '',
    location: '',
    telefono: '',
    email: '',
    password: '',
    estatus: '',
    suspendido: false,
  });

  useEffect(() => {
    axios
      .get(`https://rikoapi.onrender.com/api/client/client-obtener/${id}`)
      .then((response) => {
        setClient(response.data);
        setEditableFields({
          nombre: response.data.nombre,
          apellido: response.data.apellido,
          location: response.data.location,
          telefono: response.data.telefono,
          email: response.data.email,
          estatus: response.data.estatus,
          suspendido: response.data.suspendido,
          password: '',
        });
      })
      .catch((error) => {
        console.error("There was an error fetching the client data!", error);
      });
  }, [id]);

  const formatDate = (dateString: string): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableFields({
      ...editableFields,
      [name]: value,
    });
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditableFields({
      ...editableFields,
      password: '',
    });
  };

  const handleSaveClick = () => {
    setIsEditing(false);

    const promises: Promise<any>[] = [];
    Object.keys(editableFields).forEach((field) => {
      if (client && client[field as keyof Client] !== editableFields[field as keyof typeof editableFields] && field !== 'password') {
        promises.push(
          axios.put(`https://rikoapi.onrender.com/api/client/client-actualizar-propiedad/${id}`, {
            propiedad: field,
            valor: editableFields[field as keyof typeof editableFields],
          })
        );
      }
    });

    if (promises.length > 0) {
      Promise.all(promises)
        .then(() => {
          setClient((prevState) => ({ ...prevState, ...editableFields } as Client));
        })
        .catch((error) => {
          console.error("There was an error updating the client data!", error);
        });
    }
  };

  const handleUpdatePassword = () => {
    if (editableFields.password.trim() === '') {
      return;
    }

    axios
      .put(`https://rikoapi.onrender.com/api/client/client-password/${id}`, {
        password: editableFields.password,
      })
      .then(() => {
        setEditableFields({
          ...editableFields,
          password: '',
        });
      })
      .catch((error) => {
        console.error("There was an error updating the client password!", error);
      });
  };

  const handleCopyClick = () => {
    if (client) {
      navigator.clipboard.writeText(client._id);
    }
  };

  if (!client) return null;

  return (
    <div className="client-screen-container">
      <div className="client-screen-info">
        <button onClick={() => navigate(-1)} className="back-button">
                <ArrowLeft size={20} />
              </button>
        <h2 className="titulo-pedidos animate-slide-in">Mi Cuenta Riko</h2>
        <div className="client-screen-header">
          <div className="client-name-section">
            {isEditing ? (
              <div className="client-name-inputs">
                <input
                  type="text"
                  name="nombre"
                  value={editableFields.nombre}
                  onChange={handleFieldChange}
                  placeholder="Nombre"
                  className="client-name-input"
                />
                <input
                  type="text"
                  name="apellido"
                  value={editableFields.apellido}
                  onChange={handleFieldChange}
                  placeholder="Apellido"
                  className="client-name-input"
                />
              </div>
            ) : (
                <>
                
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                <h1 style={{ padding: '0', margin: '0'}} className="client-name">{`${client.nombre} ${client.apellido}`}</h1>
                <p className="client-id" style={{ fontSize: '0.9rem' }}>
                  {client._id} <FaRegCopy onClick={handleCopyClick} />
                </p>
              </div></>
            )}
                    <div className="edit-client-buttons">
          {isEditing ? (
            <div className="action-buttons">
              <button
                className="cancel-edit-client-button"
                onClick={handleCancelEdit}
                aria-label="Cancelar edición"
              >
                <FaTimesCircle />
                Cancelar
              </button>
              <button
                className="save-edit-client-button"
                onClick={handleSaveClick}
                aria-label="Guardar cambios"
              >
                <FaCheck />
                Guardar
              </button>
            </div>
          ) : (
            <div className="action-buttons">
              <button
                className="edit-client-button"
                onClick={handleEditClick}
                aria-label="Editar cliente"
              >
                Editar Perfil
              </button>
            </div>
          )}
        </div>
          </div>
        </div>

        <div className="client-screen-content">
          <div className="client-info-card">
            <h3>Información Personal</h3>
            <div className="info-item">
              <strong>Teléfono:</strong>
              {isEditing ? (
                <input
                  type="text"
                  name="telefono"
                  value={editableFields.telefono}
                  onChange={handleFieldChange}
                />
              ) : (
                <span>{client.telefono}</span>
              )}
            </div>
            <div className="info-item">
              <strong>Email:</strong>
              {isEditing ? (
                <input
                  type="text"
                  name="email"
                  value={editableFields.email}
                  onChange={handleFieldChange}
                />
              ) : (
                <span>{client.email}</span>
              )}
            </div>
          </div>

          <div className="client-info-card">
            <div className="info-item">
              <strong>Estado en la app:</strong>
              <span>{client.estatus}</span>
            </div>
            
                {client.suspendido ? <><div className="info-item">
                    <span style={{ color: 'red' }}>Suspendido</span>
                </div></> : ''}
            
          </div>
          <div className="client-info-card">
            <div className="info-item">
              <strong>Registrado el:</strong>
              <span>{formatDate(client.createdAt)}</span>
            </div>
            <div className="info-item">
              <strong>Actualizado el:</strong>
              <span>{formatDate(client.updatedAt)}</span>
            </div>
          </div>

          <div className="client-info-card">
            <h3>Actualizar Contraseña</h3>
            <div className="info-item">
              <input
                type="password"
                name="password"
                value={editableFields.password}
                onChange={handleFieldChange}
                className="update-password-input"
                placeholder="Nueva Contraseña"
              />
              <button
                onClick={handleUpdatePassword}
                className="update-password-button"
              >
                Actualizar Contraseña
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientScreen;