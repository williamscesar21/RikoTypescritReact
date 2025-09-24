import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../firebase';
import '../css/ChatScreen.css';
import { ArrowLeft } from 'react-feather';
import { CiImageOn } from 'react-icons/ci';
import { LocalNotifications } from '@capacitor/local-notifications';

interface Message {
  id: string;
  senderId: string;
  senderType: string;
  content: string;
  type: string;
  imageUrl?: string;
  timestamp: any;
}

const ChatScreen: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [showModal, setShowModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // ✅ Función para formatear el tiempo
  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Justo ahora';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    if (diffHrs < 24) return `Hace ${diffHrs} h`;

    return date.toLocaleString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // 🔔 Función de notificación
  const triggerNotification = async (msg: Message) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Web
      new Notification("Nuevo mensaje 📩", {
        body: msg.type === 'text' ? msg.content : "Te enviaron un archivo",
        icon: "/logoNaranja.png",
      });
    } else {
      // Capacitor (Android/iOS)
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Nuevo mensaje 📩",
            body: msg.type === 'text' ? msg.content : "Te enviaron un archivo",
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) },
            sound: "default",
          },
        ],
      });
    }
  };

  // ✅ Pedir permisos de notificaciones
  useEffect(() => {
    const requestPerms = async () => {
      if ('Notification' in window && Notification.permission !== 'granted') {
        await Notification.requestPermission();
      }
      await LocalNotifications.requestPermissions();
    };
    requestPerms();
  }, []);

  // 🔄 Escuchar mensajes en tiempo real
  useEffect(() => {
    if (!orderId) return;

    const q = query(
      collection(db, 'RikoChat', orderId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      // Detectar si llegó un nuevo mensaje
      if (messages.length && fetchedMessages.length > messages.length) {
        const newMsg = fetchedMessages[fetchedMessages.length - 1];
        if (newMsg.senderId !== auth.currentUser?.uid) {
          triggerNotification(newMsg);
        }
      }

      setMessages(fetchedMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => unsubscribe();
  }, [orderId, messages]);

  // ➡️ Enviar mensaje de texto
  const sendMessage = async () => {
    if (!newMessage.trim() || !auth.currentUser) return;
    try {
      await addDoc(collection(db, 'RikoChat', orderId!, 'messages'), {
        senderId: auth.currentUser.uid,
        senderType: 'client',
        content: newMessage,
        type: 'text',
        timestamp: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error('Error enviando mensaje:', error);
    }
  };

  // 📎 Subir comprobante de pago
  const handleFileUpload = async () => {
    if (!file || !auth.currentUser) return;
    try {
      const storageRef = ref(storage, `payment-proofs/${orderId}/${file.name}`);
      await uploadBytes(storageRef, file);
      const imageUrl = await getDownloadURL(storageRef);
      await addDoc(collection(db, 'RikoChat', orderId!, 'messages'), {
        senderId: auth.currentUser.uid,
        senderType: 'client',
        content: 'Comprobante de pago',
        type: 'image',
        imageUrl,
        timestamp: serverTimestamp(),
      });
      setFile(null);
      setShowModal(false);
    } catch (error) {
      console.error('Error subiendo comprobante:', error);
    }
  };

  return (
    <div className="chat-screen-container">
      <button onClick={() => navigate(-1)} className="back-button">
        <ArrowLeft size={20} />
      </button>

      {/* HEADER */}
      <div className="chat-header">
        <h2>Pedido</h2>
        <h6 style={{ color: '#888' }}> #{orderId}</h6>
      </div>

      {/* MENSAJES */}
      <div className="messages-container">
        {messages.length === 0 && <p className="no-messages">No hay mensajes aún.</p>}
        {messages.map((msg) => (
          <div key={msg.id} className="message-wrapper">
            <div
              className={`message ${msg.senderType === 'client' ? 'sent' : 'received'}`}
            >
              {msg.type === 'text' && <p>{msg.content}</p>}
              {msg.type === 'image' && <img src={msg.imageUrl} alt="Comprobante" />}
              {msg.type === 'location' && (
                <div className="location-message">
                  <p>📍 Mi ubicación</p>
                  <a
                    href={msg.content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="maps-button"
                  >
                    Abrir en Google Maps
                  </a>
                </div>
              )}
            </div>
            {/* Hora fuera de la burbuja */}
            <span
              className={`message-time ${
                msg.senderType === 'client' ? 'time-sent' : 'time-received'
              }`}
            >
              {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="input-container">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escribe un mensaje..."
        />
        <button className="upload-btn" onClick={() => setShowModal(true)}>
          <CiImageOn />
        </button>
        <button className="send-btn" onClick={sendMessage}>
          Enviar
        </button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Subir comprobante</h3>
            <input
              type="file"
              id="file-upload"
              accept="image/*"
              className="file-input"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="file-upload" className="custom-upload-btn">
              📎 Subir archivo
            </label>
            {file && <span className="file-name">{file.name}</span>}
            {file && (
              <div className="preview">
                <img src={URL.createObjectURL(file)} alt="preview" />
              </div>
            )}
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button className="send-proof-btn" onClick={handleFileUpload} disabled={!file}>
                Enviar Comprobante
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatScreen;
