const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwg6OWKV-I3Fu3GOl8xsOa-rEC9lNC_3G0ICm4CRdwwFvnSh0J9XIpO0WId6lyfNGLM/exec";

const formulario = document.getElementById("formularioContacto");
const boton = document.getElementById("btnEnviar");

const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const inputDescripcion = document.getElementById("descripcion");
const contadorDescripcion = document.getElementById("contadorDescripcion");

const panelOrtografia = document.getElementById("panelOrtografia");
const estadoOrtografia = document.getElementById("estadoOrtografia");
const listaOrtografia = document.getElementById("listaOrtografia");

let erroresOrtograficosActivos = [];
let palabrasIgnoradas = new Set();
let temporizadorOrtografia = null;
let controladorAbort = null;

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

function mostrarEstadoCampo(campoId, mensajeError) {
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
    return mostrarEstadoCampo("nombre", "El nombre es obligatorio.");
  }
  if (valor.length < 3) {
    return mostrarEstadoCampo("nombre", "Escribe al menos 3 caracteres.");
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/.test(valor)) {
    return mostrarEstadoCampo(
      "nombre",
      "El nombre solo debe contener letras y espacios (sin números ni símbolos).",
    );
  }
  if (/\s{2,}/.test(valor)) {
    return mostrarEstadoCampo(
      "nombre",
      "Evita poner dobles espacios entre palabras.",
    );
  }

  return mostrarEstadoCampo("nombre", "");
}

function validarCorreo() {
  const valor = inputCorreo.value.trim().toLowerCase();

  if (!valor) {
    return mostrarEstadoCampo(
      "correo",
      "El correo electrónico es obligatorio.",
    );
  }

  const regexCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!regexCorreo.test(valor)) {
    return mostrarEstadoCampo(
      "correo",
      "Formato inválido. Ejemplo válido: usuario@gmail.com",
    );
  }

  const dominio = valor.split("@")[1];
  if (dominiosMalEscritos[dominio]) {
    return mostrarEstadoCampo(
      "correo",
      `¿Quisiste escribir @${dominiosMalEscritos[dominio]}? Revisa la ortografía del dominio.`,
    );
  }

  return mostrarEstadoCampo("correo", "");
}

function validarDescripcionBasica() {
  const texto = inputDescripcion.value;
  const valor = texto.trim();
  contadorDescripcion.textContent = `${texto.length} / 5000`;

  if (!valor) {
    ocultarPanelOrtografia();
    return mostrarEstadoCampo("descripcion", "La descripción es obligatoria.");
  }
  if (valor.length < 10) {
    ocultarPanelOrtografia();
    return mostrarEstadoCampo(
      "descripcion",
      `Escribe al menos 10 caracteres (llevas ${valor.length}).`,
    );
  }
  if (/(.)\1{5,}/.test(valor)) {
    return mostrarEstadoCampo(
      "descripcion",
      "Evita repetir la misma letra demasiadas veces seguidas.",
    );
  }

  if (erroresOrtograficosActivos.length > 0) {
    return mostrarEstadoCampo(
      "descripcion",
      `Corrige ${erroresOrtograficosActivos.length} error(es) de ortografía o tildes marcados abajo.`,
    );
  }

  return mostrarEstadoCampo("descripcion", "");
}

function ocultarPanelOrtografia() {
  erroresOrtograficosActivos = [];
  panelOrtografia.classList.add("oculto");
  listaOrtografia.innerHTML = "";
}

// Revisión ortográfica real en español (tildes, letras, gramática) con LanguageTool
async function revisarOrtografiaEnTiempoReal() {
  const texto = inputDescripcion.value;

  if (texto.trim().length < 4) {
    ocultarPanelOrtografia();
    return;
  }

  if (controladorAbort) {
    controladorAbort.abort();
  }
  controladorAbort = new AbortController();

  panelOrtografia.classList.remove("oculto", "limpio");
  panelOrtografia.classList.add("revisando");
  estadoOrtografia.textContent = "Revisando ortografía y tildes...";

  try {
    const params = new URLSearchParams();
    params.append("text", texto);
    params.append("language", "es");

    const respuesta = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
      signal: controladorAbort.signal,
    });

    const data = await respuesta.json();
    const coincidencias = (data.matches || []).filter((item) => {
      const palabraOriginal = texto.substr(item.offset, item.length);
      return !palabrasIgnoradas.has(palabraOriginal.toLowerCase());
    });

    erroresOrtograficosActivos = coincidencias;
    renderizarErroresOrtograficos(texto, coincidencias);
    validarDescripcionBasica();
  } catch (err) {
    if (err.name !== "AbortError") {
      panelOrtografia.classList.add("oculto");
    }
  }
}

function renderizarErroresOrtograficos(textoCompleto, coincidencias) {
  listaOrtografia.innerHTML = "";

  if (coincidencias.length === 0) {
    panelOrtografia.classList.remove("oculto", "revisando");
    panelOrtografia.classList.add("limpio");
    estadoOrtografia.textContent = "✓ Ortografía y tildes correctas.";
    return;
  }

  panelOrtografia.classList.remove("oculto", "revisando", "limpio");
  estadoOrtografia.textContent = `Se encontraron ${coincidencias.length} error(es) de ortografía o tilde:`;

  coincidencias.forEach((error) => {
    const palabraMal = textoCompleto.substr(error.offset, error.length);
    const li = document.createElement("li");
    li.className = "item-ortografia";

    const detalle = document.createElement("div");
    detalle.className = "detalle-palabra";
    detalle.innerHTML = `<span class="palabra-mal">${escaparHTML(palabraMal)}</span> — ${escaparHTML(error.message)}`;
    li.appendChild(detalle);

    const contenedorChips = document.createElement("div");
    contenedorChips.className = "sugerencias-chips";

    const sugerencias = (error.replacements || []).slice(0, 4);
    sugerencias.forEach((sug) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-sugerencia";
      btn.textContent = sug.value;
      btn.title = `Reemplazar "${palabraMal}" por "${sug.value}"`;
      btn.addEventListener("click", () => {
        aplicarCorreccion(error.offset, error.length, sug.value);
      });
      contenedorChips.appendChild(btn);
    });

    const btnIgnorar = document.createElement("button");
    btnIgnorar.type = "button";
    btnIgnorar.className = "btn-ignorar";
    btnIgnorar.textContent = "Ignorar";
    btnIgnorar.addEventListener("click", () => {
      palabrasIgnoradas.add(palabraMal.toLowerCase());
      revisarOrtografiaEnTiempoReal();
    });
    contenedorChips.appendChild(btnIgnorar);

    li.appendChild(contenedorChips);
    listaOrtografia.appendChild(li);
  });
}

function aplicarCorreccion(offset, length, reemplazo) {
  const textoActual = inputDescripcion.value;
  const nuevoTexto =
    textoActual.slice(0, offset) +
    reemplazo +
    textoActual.slice(offset + length);

  inputDescripcion.value = nuevoTexto;
  inputDescripcion.focus();
  revisarOrtografiaEnTiempoReal();
}

function escaparHTML(texto) {
  const div = document.createElement("div");
  div.textContent = texto;
  return div.innerHTML;
}

// Eventos en tiempo real
inputNombre.addEventListener("input", validarNombre);
inputNombre.addEventListener("blur", validarNombre);

inputCorreo.addEventListener("input", validarCorreo);
inputCorreo.addEventListener("blur", validarCorreo);

inputDescripcion.addEventListener("input", () => {
  validarDescripcionBasica();
  clearTimeout(temporizadorOrtografia);
  temporizadorOrtografia = setTimeout(revisarOrtografiaEnTiempoReal, 450);
});

inputDescripcion.addEventListener("blur", () => {
  clearTimeout(temporizadorOrtografia);
  revisarOrtografiaEnTiempoReal();
});

function limpiarEstilosValidacion() {
  ["nombre", "correo", "descripcion"].forEach((id) => {
    const grupo = document.getElementById(`grupo-${id}`);
    const span = document.getElementById(`error-${id}`);
    grupo.classList.remove("valido", "invalido");
    span.textContent = "";
  });
  contadorDescripcion.textContent = "0 / 5000";
  palabrasIgnoradas.clear();
  ocultarPanelOrtografia();
}

formulario.addEventListener("submit", async function (e) {
  e.preventDefault();

  await revisarOrtografiaEnTiempoReal();

  const nombreOk = validarNombre();
  const correoOk = validarCorreo();
  const descripcionOk = validarDescripcionBasica();

  if (!nombreOk || !correoOk || !descripcionOk) {
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
