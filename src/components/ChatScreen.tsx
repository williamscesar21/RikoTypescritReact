import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'react-feather';

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

  // Verificar usuario autenticado
  useEffect(() => {
    console.log('Current Firebase user:', auth.currentUser);
  }, []);

  // Cargar mensajes en tiempo real
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
      setMessages(fetchedMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    return () => unsubscribe();
  }, [orderId]);

  // Enviar mensaje de texto
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

  // Subir comprobante de pago
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
        <h6 style={{ color: '#FF7F00' }}> #{orderId}</h6>
        <button className="upload-btn" onClick={() => setShowModal(true)}>
          Subir Comprobante de Pago
        </button>
      </div>

{/* MENSAJES */}
<div className="messages-container">
  {messages.length === 0 && <p className="no-messages">No hay mensajes aún.</p>}
  {messages.map((msg) => (
    <div
      key={msg.id}
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
        <button onClick={sendMessage}>Enviar</button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Subir comprobante</h3>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file && (
              <div className="preview">
                <img src={URL.createObjectURL(file)} alt="preview" />
              </div>
            )}
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className="send-proof-btn"
                onClick={handleFileUpload}
                disabled={!file}
              >
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
