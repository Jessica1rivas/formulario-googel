const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbyVZszd6gD-4O-nGloge0EBWTi9jHTPrJMHeYGdf4unnoNNDZhZ6TzTu4A9TCLNieib/exec";

const formulario = document.getElementById("formularioContacto");
const boton = document.getElementById("btnEnviar");

const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const inputDescripcion = document.getElementById("descripcion");
const contadorDescripcion = document.getElementById("contadorDescripcion");

const dominiosMalEscritos = {
  "gmial.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.con": "gmail.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
};

function mostrarEstadoCampo(campoId, inputEl, mensajeError) {
  const grupo = document.getElementById(`grupo-${campoId}`);
  const spanError = document.getElementById(`error-${campoId}`);

  if (mensajeError) {
    grupo.classList.add("invalido");
    grupo.classList.remove("valido");
    spanError.textContent = mensajeError;
    return false;
  } else {
    grupo.classList.remove("invalido");
    grupo.classList.add("valido");
    spanError.textContent = "";
    return true;
  }
}

function validarNombre() {
  const valor = inputNombre.value.trim();

  if (!valor) {
    return mostrarEstadoCampo(
      "nombre",
      inputNombre,
      "El nombre es obligatorio.",
    );
  }
  if (valor.length < 3) {
    return mostrarEstadoCampo(
      "nombre",
      inputNombre,
      "Escribe al menos 3 caracteres.",
    );
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(valor)) {
    return mostrarEstadoCampo(
      "nombre",
      inputNombre,
      "El nombre solo debe contener letras y espacios (sin números ni símbolos).",
    );
  }
  if (/\s{2,}/.test(valor)) {
    return mostrarEstadoCampo(
      "nombre",
      inputNombre,
      "Evita poner dobles espacios entre palabras.",
    );
  }

  return mostrarEstadoCampo("nombre", inputNombre, "");
}

function validarCorreo() {
  const valor = inputCorreo.value.trim().toLowerCase();

  if (!valor) {
    return mostrarEstadoCampo(
      "correo",
      inputCorreo,
      "El correo electrónico es obligatorio.",
    );
  }

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!regexCorreo.test(valor)) {
    return mostrarEstadoCampo(
      "correo",
      inputCorreo,
      "Formato inválido. Ejemplo válido: usuario@gmail.com",
    );
  }

  const dominio = valor.split("@")[1];
  if (dominiosMalEscritos[dominio]) {
    return mostrarEstadoCampo(
      "correo",
      inputCorreo,
      `¿Quisiste escribir @${dominiosMalEscritos[dominio]}? Revisa la ortografía del dominio.`,
    );
  }

  return mostrarEstadoCampo("correo", inputCorreo, "");
}

function validarDescripcion() {
  const valor = inputDescripcion.value.trim();
  contadorDescripcion.textContent = `${inputDescripcion.value.length} / 5000`;

  if (!valor) {
    return mostrarEstadoCampo(
      "descripcion",
      inputDescripcion,
      "La descripción es obligatoria.",
    );
  }
  if (valor.length < 10) {
    return mostrarEstadoCampo(
      "descripcion",
      inputDescripcion,
      `Escribe al menos 10 caracteres (llevas ${valor.length}).`,
    );
  }
  if (/(.)\1{5,}/.test(valor)) {
    return mostrarEstadoCampo(
      "descripcion",
      inputDescripcion,
      "Evita repetir la misma letra demasiadas veces seguidas.",
    );
  }

  return mostrarEstadoCampo("descripcion", inputDescripcion, "");
}

// Validación en tiempo real mientras se escribe y al salir del campo
inputNombre.addEventListener("input", validarNombre);
inputNombre.addEventListener("blur", validarNombre);

inputCorreo.addEventListener("input", validarCorreo);
inputCorreo.addEventListener("blur", validarCorreo);

inputDescripcion.addEventListener("input", validarDescripcion);
inputDescripcion.addEventListener("blur", validarDescripcion);

function limpiarEstilosValidacion() {
  ["nombre", "correo", "descripcion"].forEach((id) => {
    const grupo = document.getElementById(`grupo-${id}`);
    const span = document.getElementById(`error-${id}`);
    grupo.classList.remove("valido", "invalido");
    span.textContent = "";
  });
  contadorDescripcion.textContent = "0 / 5000";
}

formulario.addEventListener("submit", async function (e) {
  e.preventDefault();

  const nombreOk = validarNombre();
  const correoOk = validarCorreo();
  const descripcionOk = validarDescripcion();

  if (!nombreOk || !correoOk || !descripcionOk) {
    // Enfocar el primer campo con error
    if (!nombreOk) inputNombre.focus();
    else if (!correoOk) inputCorreo.focus();
    else inputDescripcion.focus();
    return;
  }

  boton.disabled = true;
  boton.textContent = "Enviando...";

  try {
    const datos = new URLSearchParams();
    datos.append("nombre", inputNombre.value.trim());
    datos.append("correo", inputCorreo.value.trim());
    datos.append("descripcion", inputDescripcion.value.trim());
    datos.append("website", document.getElementById("website").value);

    await fetch(URL_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      body: datos,
    });

    formulario.reset();
    limpiarEstilosValidacion();

    // Modal animado con check verde, botón de cierre y autocierre en 3 segundos
    Swal.fire({
      icon: "success",
      title: "¡Mensaje enviado!",
      text: "Hemos recibido tu mensaje correctamente. Nos pondremos en contacto contigo pronto.",
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#4568dc",
      timer: 3000,
      timerProgressBar: true,
    });
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "No se pudo enviar",
      text: "Ocurrió un problema de conexión. Por favor, inténtalo nuevamente.",
      showCloseButton: true,
      confirmButtonText: "Cerrar",
      confirmButtonColor: "#dc2626",
    });
  } finally {
    boton.disabled = false;
    boton.textContent = "Enviar mensaje";
  }
});
