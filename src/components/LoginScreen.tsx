import React, { useEffect, useState } from 'react';
import '../css/AdminLog.css';
import axios from 'axios';
import { ArrowRight } from 'react-feather';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';
import { signInWithCustomToken } from 'firebase/auth';
import { auth } from '../firebase';
import { getAuth } from 'firebase/auth';
// import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

const LoginScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState(1);

  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [telefono, setTelefono] = useState('');
  const [location, setLocation] = useState('');

  // ✅ Manejo del teclado móvil
  useEffect(() => {
    let showListener: any;
    let hideListener: any;

    const initKeyboardListeners = async () => {
      showListener = await Keyboard.addListener('keyboardWillShow', () => {
        document.body.classList.add('keyboard-is-open');
      });

      hideListener = await Keyboard.addListener('keyboardWillHide', () => {
        document.body.classList.remove('keyboard-is-open');
      });
    };

    initKeyboardListeners();

    return () => {
      showListener?.remove?.();
      hideListener?.remove?.();
    };
  }, []);

  // ✅ Centrar inputs al enfocar
  useEffect(() => {
    const inputs = document.querySelectorAll('input, textarea');

    const handleFocus = (el: Element) => {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    };

    inputs.forEach((el) => {
      el.addEventListener('focus', () => handleFocus(el));
    });

    return () => {
      inputs.forEach((el) => {
        el.removeEventListener('focus', () => handleFocus(el));
      });
    };
  }, []);

  // 📍 Obtener ubicación en web y capacitor
  useEffect(() => {
    const getLocation = async () => {
      try {
        if (Capacitor.getPlatform() !== 'web') {
          const permission = await Geolocation.requestPermissions();
          if (permission.location === 'granted') {
            const position = await Geolocation.getCurrentPosition();
            const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
            setLocation(coords);
            localStorage.setItem('userLocation', coords); // 🆕 Guarda en localStorage
            console.log('📍 Coordenadas (Capacitor):', coords);
          } else {
            alert('Permiso de ubicación denegado.');
          }
        } else {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const coords = `${position.coords.latitude}, ${position.coords.longitude}`;
              setLocation(coords);
              localStorage.setItem('userLocation', coords); // 🆕 Guarda en localStorage
              console.log('📍 Coordenadas (Web):', coords);
            },
            (error) => {
              alert('Error obteniendo ubicación en el navegador.');
              console.error(error);
            }
          );
        }

      } catch (error) {
        alert('Error al obtener ubicación');
        console.error(error);
      }
    };

    if (activeTab === 'signup') {
      getLocation();
    }
  }, [activeTab]);

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Paso 1: Autenticar con rikoapi
      console.log('Attempting login with:', { correo });
      const response = await axios.post('https://rikoapi.onrender.com/api/client/client-login', {
        correo,
        password,
      });
      console.log('rikoapi response:', response.data);

      // Paso 2: Guardar datos de rikoapi
      const { token, client } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('username', client.nombre);
      localStorage.setItem('clientId', client._id);
      console.log('Stored in localStorage:', { token, username: client.nombre, clientId: client._id });

      // Paso 3: Obtener Firebase custom token
      console.log('Requesting Firebase token with JWT:', token);
      const firebaseResponse = await axios.post('https://rikoapi.onrender.com/api/client/client-firebase-token', {
        token,
      });
      console.log('Firebase response:', firebaseResponse.data);

      // Paso 4: Iniciar sesión en Firebase con Web SDK
      console.log('Attempting Firebase sign-in with Web SDK');
      console.log('Firebase custom token:', firebaseResponse.data.firebaseToken);
      const userCredential = await signInWithCustomToken(auth, firebaseResponse.data.firebaseToken);
      console.log('Firebase user:', userCredential.user);

      // Paso 5: Verificar usuario autenticado
      const currentUser = getAuth().currentUser;
      console.log('Current Firebase user after sign-in:', currentUser);
      if (!currentUser) {
        throw new Error('No user returned from Firebase sign-in');
      }

      // Paso 6: Recargar para activar lógica de App.tsx
      window.location.reload();
    } catch (error: any) {
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales o intenta de nuevo.';
      if (error.response) {
        if (error.response.status === 400) {
          errorMessage = error.response.data.message || 'Usuario o contraseña incorrectos.';
        } else if (error.response.status === 401) {
          errorMessage = `Token inválido para Firebase: ${error.response.data.details || 'Sin detalles'}`;
        } else {
          errorMessage = error.response.data.error || 'Error en el servidor.';
        }
      } else if (error.code === 'auth/invalid-custom-token') {
        errorMessage = 'Token de Firebase inválido. Verifica la configuración del backend.';
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = 'Error de configuración de Firebase. Verifica firebase.ts.';
      } else {
        errorMessage = error.message || 'Error desconocido. Contacta al soporte.';
      }
      console.error('Error al iniciar sesión:', error.response?.data || error.message || error);
      alert(errorMessage);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    const registerPayload = {
      nombre,
      apellido,
      email: correo,
      password,
      telefono,
      location
    };

    console.log('JSON de registro:', registerPayload);

    try {
      await axios.post('https://rikoapi.onrender.com/api/client/client-registrar', registerPayload);
      alert('Registro exitoso. Ahora puedes iniciar sesión.');
      setActiveTab('login');
      setStep(1);
    } catch (error) {
      alert('Error al registrarse');
      console.error(error);
    }
  };

  const renderStepSignup = () => {
    switch (step) {
      case 1:
        return (
          <>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input type="text" value={apellido} onChange={(e) => setApellido(e.target.value)} required />
            </div>
            <div className="next-div" onClick={() => setStep(2)}><ArrowRight /></div>
          </>
        );
      case 2:
        return (
          <>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
            </div>
            <div className="next-div" onClick={() => setStep(3)}><ArrowRight /></div>
          </>
        );
      case 3:
        return (
          <>
            <div className="form-group">
              <label>Correo</label>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            </div>
            <div className="next-div" onClick={() => setStep(4)}><ArrowRight /></div>
          </>
        );
      case 4:
        return (
          <>
            <div className="form-group">
              <label>Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Confirmar Contraseña</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="submit-button">Registrarse</button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="page-wrapper">
      <div className="container-login">
        <div className="header-login">
          <img src="/logoNaranja.png" alt="Logo" className="logo" />
          <p className="title-log">Pide Donde Quieras y Cuando Quieras</p>
          <p className="subtitle">Inicia sesión o crea tu cuenta</p>
        </div>

        <div className="tabs-list">
          <button className={`tabs-trigger ${activeTab === 'login' ? 'active' : ''}`} onClick={() => setActiveTab('login')}>
            Iniciar Sesión
          </button>
          <button className={`tabs-trigger ${activeTab === 'signup' ? 'active' : ''}`} onClick={() => { setActiveTab('signup'); setStep(1); }}>
            Registrarse
          </button>
        </div>

        <div className="tabs-content">
          {activeTab === 'login' ? (
            <form className="form" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="correo">Correo</label>
                <input id="correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
              </div>
              <div className="form-group">
                <label htmlFor="password">Contraseña</label>
                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="submit-button">Iniciar Sesión</button>
              <p className="forgot-password" style={{ color: '#FF7F00', textAlign: 'center' }} onClick={() => window.location.href = '/forgot-password'}>¿Olvidaste tu contraseña?</p>
            </form>
          ) : (
            <form className="form" onSubmit={handleSignup}>
              {renderStepSignup()}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
