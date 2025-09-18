import React, { useState } from "react";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import axios from "axios";

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [correo, setCorreo] = useState("");
  const [clientId, setClientId] = useState("");
  const [telefono, setTelefono] = useState("");

  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const auth = getAuth();

  // Paso 1: Buscar cliente por correo
  const findClient = async () => {
    try {
      const response = await axios.get("https://rikoapi.onrender.com/api/client/client-obtener");
      const clientes = response.data;

      const client = clientes.find((c: any) => c.email === correo);
      if (!client) {
        alert("No se encontró un cliente con este correo ❌");
        return;
      }

      setClientId(client._id);
      setTelefono(client.telefono);
      setStep(2);
      alert(`Cliente encontrado ✅. Enviaremos SMS al número: ${client.telefono}`);
    } catch (error) {
      console.error(error);
      alert("Error buscando el cliente ❌");
    }
  };

    // Función para convertir a formato E.164 (ej: Venezuela +58)
    const formatPhone = (phone: string) => {
    let cleaned = phone.trim();

    // Si empieza con 0 -> lo quitamos
    if (cleaned.startsWith("0")) {
        cleaned = cleaned.substring(1);
    }

    // Si ya empieza con + -> lo dejamos
    if (cleaned.startsWith("+")) {
        return cleaned;
    }

    // Por defecto asumimos Venezuela (+58)
    return `+58${cleaned}`;
    };


    // Paso 2: Enviar SMS
    const sendCode = async () => {
    try {
        const formattedPhone = formatPhone(telefono);
        console.log("📱 Enviando código a:", formattedPhone);

        const verifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" } // invisible recaptcha (más limpio)
        );

        const result = await signInWithPhoneNumber(auth, formattedPhone, verifier);
        setConfirmationResult(result);
        alert("Código enviado por SMS ✅");
    } catch (error) {
        console.error("Error en sendCode:", error);
        alert("Error enviando el código ❌");
    }
    };


  // Paso 3: Verificar SMS
  const verifyCode = async () => {
    try {
      await confirmationResult.confirm(code);
      setStep(3);
      alert("Teléfono verificado ✅, ahora coloca tu nueva contraseña");
    } catch (error) {
      console.error(error);
      alert("Código incorrecto ❌");
    }
  };

// Paso 4: Cambiar contraseña
const changePassword = async () => {
  try {
    await axios.put(
      `https://rikoapi.onrender.com/api/client/client-password/${clientId}`,
      { password: newPassword }   // 👈 cambia aquí
    );
    alert("Contraseña actualizada con éxito ✅, ahora inicia sesión");
    window.location.href = "/login";
  } catch (error) {
    console.error(error);
    alert("Error cambiando la contraseña ❌");
  }
};


  return (
    <div className="page-wrapper">
      <div className="container-login">
        <h2 style={{margin: "0px"}}>Recuperar Contraseña</h2>

        {/* Paso 1: Buscar cliente */}
        {step === 1 && (
          <>
            <div className="form-group">
              <label>Correo</label>
              <input
                type="email"
                placeholder="tuemail@ejemplo.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
              />
            </div>
            <button onClick={findClient} className="submit-button">
              Buscar Cliente
            </button>
            <p className="forgot-password" style={{ color: '#FF7F00', textAlign: 'center' }} onClick={() => window.location.href = '/'}>Cancelar</p>

          </>
        )}

        {/* Paso 2: Enviar/Verificar SMS */}
        {step === 2 && (
          <>
            <p style={{ color: "gray" }}>Se enviará un SMS al número registrado: <b>{telefono}</b></p>
            <div id="recaptcha-container"></div>
            <button onClick={sendCode} className="submit-button">
              Enviar Código SMS
            </button>

            <div className="form-group" style={{ marginTop: "15px" }}>
              <label>Código SMS</label>
              <input
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button onClick={verifyCode} className="submit-button">
              Verificar Código
            </button>
            <p className="forgot-password" style={{ color: '#FF7F00', textAlign: 'center' }} onClick={() => window.location.href = '/'}>Cancelar</p>
          </>
        )}

        {/* Paso 3: Nueva contraseña */}
        {step === 3 && (
          <>
            <div className="form-group">
              <label>Nueva Contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button onClick={changePassword} className="submit-button">
              Cambiar Contraseña
            </button>
            <p className="forgot-password" style={{ color: '#FF7F00', textAlign: 'center' }} onClick={() => window.location.href = '/'}>Cancelar</p>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
