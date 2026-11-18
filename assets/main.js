const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbzPt5NDJnVwPbDAUomWOwVFwYGD1Wmkybttb4Wkw8vgCFrCAxVP9voSW6ziqimFYcWY/exec";

const LIMITE_NOMBRE = 100;
const LIMITE_DESCRIPCION = 5000;

const formulario = document.getElementById("formularioContacto");
const boton = document.getElementById("btnEnviar");
const textoBotonEnviar = document.getElementById("textoBotonEnviar");

const inputNombre = document.getElementById("nombre");
const inputCorreo = document.getElementById("correo");
const inputDescripcion = document.getElementById("descripcion");
const capaResaltado = document.getElementById("capaResaltado");
const contadorDescripcion = document.getElementById("contadorDescripcion");
const badgeOrtografia = document.getElementById("badgeOrtografia");

// Panel ortográfico flotante
const panelLateral = document.getElementById("panelLateral");
const subtituloOrtografia = document.getElementById("subtituloOrtografia");
const listaOrtografia = document.getElementById("listaOrtografia");
const btnCorregirTodo = document.getElementById("btnCorregirTodo");
const btnCerrarPanel = document.getElementById("btnCerrarPanel");

// Guía paso a paso (Tour)
const btnIniciarGuia = document.getElementById("btnIniciarGuia");
const tourOverlay = document.getElementById("tourOverlay");
const tourTooltip = document.getElementById("tourTooltip");
const tourPasoBadge = document.getElementById("tourPasoBadge");
const tourTitulo = document.getElementById("tourTitulo");
const tourTexto = document.getElementById("tourTexto");
const tourSiguiente = document.getElementById("tourSiguiente");
const tourSaltar = document.getElementById("tourSaltar");
const tourCerrar = document.getElementById("tourCerrar");

let erroresOrtograficosActivos = [];
let palabrasIgnoradas = new Set();
let temporizadorOrtografia = null;
let controladorAbort = null;

// =========================================================
// 1. GUÍA INTERACTIVA PASO A PASO (AL ENTRAR Y TRAS 10s SIN MOVER EL MOUSE)
// =========================================================
const pasosGuia = [
  {
    elemento: document.getElementById("grupo-nombre"),
    input: inputNombre,
    titulo: "1. Escribe tu nombre completo",
    texto:
      "Empieza escribiendo aquí tu nombre y apellido (máximo 100 caracteres).",
  },
  {
    elemento: document.getElementById("grupo-correo"),
    input: inputCorreo,
    titulo: "2. Ingresa tu correo electrónico",
    texto:
      "Escribe un correo válido (ejemplo: usuario@gmail.com) para poder responderte.",
  },
  {
    elemento: document.getElementById("grupo-descripcion"),
    input: inputDescripcion,
    titulo: "3. Redacta tu mensaje",
    texto:
      "Escribe tu consulta aquí (máximo 5000 caracteres). Si falta alguna tilde, saldrá una sugerencia flotante arriba a la derecha.",
  },
  {
    elemento: boton,
    input: boton,
    titulo: "4. Envía tu correo",
    texto:
      "Cuando tengas todo listo, haz clic en «ENVIAR →» para mandar tu mensaje.",
  },
];

let indicePasoActual = 0;
let tourActivo = false;
let temporizadorInactividad = null;

function detectarPrimerPasoPendiente() {
  if (inputNombre.value.trim().length < 2) return 0;
  if (!inputCorreo.value.trim().includes("@")) return 1;
  if (inputDescripcion.value.trim().length < 5) return 2;
  return 3;
}

function posicionarTooltip(elementoObjetivo) {
  const rect = elementoObjetivo.getBoundingClientRect();
  const anchoTooltip = 310;
  const margen = 14;

  let top = rect.bottom + margen;
  let left = rect.left + rect.width / 2 - anchoTooltip / 2;

  if (top + 185 > window.innerHeight) {
    top = Math.max(15, rect.top - 185);
  }

  left = Math.max(15, Math.min(left, window.innerWidth - anchoTooltip - 15));

  tourTooltip.style.top = `${top}px`;
  tourTooltip.style.left = `${left}px`;
}

function mostrarPasoGuia(indice) {
  document
    .querySelectorAll(".tour-elemento-destacado")
    .forEach((el) => el.classList.remove("tour-elemento-destacado"));

  if (indice >= pasosGuia.length) {
    cerrarGuia(true);
    return;
  }

  indicePasoActual = indice;
  tourActivo = true;

  const paso = pasosGuia[indice];
  tourOverlay.classList.remove("oculto");
  tourTooltip.classList.remove("oculto");

  paso.elemento.classList.add("tour-elemento-destacado");
  paso.elemento.scrollIntoView({ behavior: "smooth", block: "center" });

  tourPasoBadge.textContent = `Paso ${indice + 1} de ${pasosGuia.length}`;
  tourTitulo.textContent = paso.titulo;
  tourTexto.textContent = paso.texto;
  tourSiguiente.textContent =
    indice === pasosGuia.length - 1 ? "Finalizar guía ✓" : "Siguiente →";

  posicionarTooltip(paso.elemento);

  if (paso.input && paso.input !== boton) {
    paso.input.focus();
  }
}

function cerrarGuia(mostrarFelicitacion = false) {
  tourActivo = false;
  tourOverlay.classList.add("oculto");
  tourTooltip.classList.add("oculto");
  document
    .querySelectorAll(".tour-elemento-destacado")
    .forEach((el) => el.classList.remove("tour-elemento-destacado"));

  reiniciarTemporizadorInactividad();

  if (mostrarFelicitacion) {
    Swal.fire({
      icon: "success",
      title: "¡Felicidades, aprendiste a enviar un correo!",
      text: "Ya conoces todos los pasos del formulario. Ahora puedes completar tus datos y enviarlo.",
      showCloseButton: true,
      confirmButtonText: "¡Entendido!",
      confirmButtonColor: "#6B6EB8",
      timer: 4000,
      timerProgressBar: true,
    });
  }
}

function reiniciarTemporizadorInactividad() {
  clearTimeout(temporizadorInactividad);
  if (tourActivo) return;

  temporizadorInactividad = setTimeout(() => {
    const pasoPendiente = detectarPrimerPasoPendiente();
    mostrarPasoGuia(pasoPendiente);
  }, 10000);
}

["mousemove", "mousedown", "keydown", "touchstart", "scroll"].forEach(
  (evento) => {
    window.addEventListener(evento, reiniciarTemporizadorInactividad, {
      passive: true,
    });
  },
);

window.addEventListener("resize", () => {
  if (tourActivo && pasosGuia[indicePasoActual]) {
    posicionarTooltip(pasosGuia[indicePasoActual].elemento);
  }
});

tourSiguiente.addEventListener("click", () => {
  mostrarPasoGuia(indicePasoActual + 1);
});

tourSaltar.addEventListener("click", () => cerrarGuia(false));
tourCerrar.addEventListener("click", () => cerrarGuia(false));
tourOverlay.addEventListener("click", () => cerrarGuia(false));
btnIniciarGuia.addEventListener("click", () => mostrarPasoGuia(0));

window.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    mostrarPasoGuia(0);
  }, 450);
});

// =========================================================
// 2. VALIDACIONES DE CAMPOS Y LÍMITE ESTRICTO DE CARACTERES
// =========================================================
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
  if (valor.length > LIMITE_NOMBRE) {
    return mostrarEstadoCampo(
      "nombre",
      `Superaste el límite de ${LIMITE_NOMBRE} caracteres (${valor.length}/${LIMITE_NOMBRE}).`,
    );
  }
  if (valor.length < 2) {
    return mostrarEstadoCampo("nombre", "Escribe al menos 2 caracteres.");
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'.-]+$/.test(valor)) {
    return mostrarEstadoCampo(
      "nombre",
      "Usa solo letras y espacios en tu nombre.",
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
      "Escribe un correo válido (ejemplo: usuario@gmail.com).",
    );
  }

  const dominio = valor.split("@")[1];
  if (dominiosMalEscritos[dominio]) {
    return mostrarEstadoCampo(
      "correo",
      `¿Quisiste escribir @${dominiosMalEscritos[dominio]}?`,
    );
  }

  return mostrarEstadoCampo("correo", "");
}

function validarDescripcion() {
  const texto = inputDescripcion.value;
  const longitud = texto.length;
  const valor = texto.trim();

  contadorDescripcion.textContent = `${longitud} / ${LIMITE_DESCRIPCION}`;

  if (longitud > LIMITE_DESCRIPCION) {
    contadorDescripcion.classList.add("excedido");
    return mostrarEstadoCampo(
      "descripcion",
      `Has superado el límite máximo de ${LIMITE_DESCRIPCION} caracteres (tienes ${longitud}). Reduce el texto para poder enviar.`,
    );
  } else {
    contadorDescripcion.classList.remove("excedido");
  }

  if (!valor) {
    ocultarPanelOrtografia();
    return mostrarEstadoCampo("descripcion", "La descripción es obligatoria.");
  }
  if (valor.length < 5) {
    return mostrarEstadoCampo(
      "descripcion",
      "Escribe un mensaje un poco más detallado (mínimo 5 caracteres).",
    );
  }

  return mostrarEstadoCampo("descripcion", "");
}

// =========================================================
// 3. ASISTENTE ORTOGRÁFICO SUAVE Y FLOTANTE (NO BLOQUEA NI MUEVE NADA)
// =========================================================
function actualizarSubrayadoEnTexto(texto, coincidencias) {
  if (!texto || !coincidencias || coincidencias.length === 0) {
    capaResaltado.textContent = texto;
    return;
  }

  const ordenadas = [...coincidencias].sort((a, b) => a.offset - b.offset);
  let html = "";
  let cursor = 0;

  ordenadas.forEach((err) => {
    if (err.offset < cursor) return;
    html += escaparHTML(texto.slice(cursor, err.offset));
    html += `<mark class="marca-error">${escaparHTML(
      texto.slice(err.offset, err.offset + err.length),
    )}</mark>`;
    cursor = err.offset + err.length;
  });

  html += escaparHTML(texto.slice(cursor));
  if (texto.endsWith("\n")) html += " ";

  capaResaltado.innerHTML = html;
  sincronizarScroll();
}

function sincronizarScroll() {
  capaResaltado.scrollTop = inputDescripcion.scrollTop;
  capaResaltado.scrollLeft = inputDescripcion.scrollLeft;
}

inputDescripcion.addEventListener("scroll", sincronizarScroll);

function ocultarPanelOrtografia() {
  erroresOrtograficosActivos = [];
  capaResaltado.textContent = inputDescripcion.value;
  panelLateral.classList.add("oculto");
  listaOrtografia.innerHTML = "";
  badgeOrtografia.className = "badge-ortografia";
  badgeOrtografia.textContent = "";
}

async function revisarOrtografiaSuave() {
  const texto = inputDescripcion.value;

  if (texto.trim().length < 4 || texto.length > LIMITE_DESCRIPCION) {
    ocultarPanelOrtografia();
    return;
  }

  if (controladorAbort) {
    controladorAbort.abort();
  }
  controladorAbort = new AbortController();

  badgeOrtografia.className = "badge-ortografia revisando";
  badgeOrtografia.textContent = "Revisando...";

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

    const erroresReales = (data.matches || []).filter((item) => {
      const palabra = texto.substr(item.offset, item.length);
      if (palabrasIgnoradas.has(palabra.toLowerCase())) return false;
      if (!item.replacements || item.replacements.length === 0) return false;
      if (/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+$/.test(palabra) && item.offset > 0)
        return false;
      return true;
    });

    erroresOrtograficosActivos = erroresReales;
    actualizarSubrayadoEnTexto(texto, erroresReales);
    renderizarPanelFlotante(texto, erroresReales);
  } catch (err) {
    if (err.name !== "AbortError") {
      ocultarPanelOrtografia();
    }
  }
}

function renderizarPanelFlotante(textoCompleto, coincidencias) {
  listaOrtografia.innerHTML = "";

  if (coincidencias.length === 0) {
    panelLateral.classList.add("oculto");
    badgeOrtografia.className = "badge-ortografia ok";
    badgeOrtografia.textContent = "✓ Todo bien";
    return;
  }

  panelLateral.classList.remove("oculto");
  badgeOrtografia.className = "badge-ortografia alerta";
  badgeOrtografia.textContent = `${coincidencias.length} sugerencia(s)`;
  subtituloOrtografia.textContent = `${coincidencias.length} palabra(s) por revisar`;

  coincidencias.forEach((error) => {
    const palabraMal = textoCompleto.substr(error.offset, error.length);
    const li = document.createElement("li");
    li.className = "item-ortografia";

    const spanMal = document.createElement("span");
    spanMal.className = "palabra-mal";
    spanMal.textContent = palabraMal;
    li.appendChild(spanMal);

    const explicacion = document.createElement("p");
    explicacion.className = "explicacion-error";
    explicacion.textContent = error.message;
    li.appendChild(explicacion);

    const chips = document.createElement("div");
    chips.className = "sugerencias-chips";

    error.replacements.slice(0, 3).forEach((sug) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn-sugerencia";
      btn.textContent = sug.value;
      btn.addEventListener("click", () => {
        const actual = inputDescripcion.value;
        inputDescripcion.value =
          actual.slice(0, error.offset) +
          sug.value +
          actual.slice(error.offset + error.length);
        inputDescripcion.focus();
        validarDescripcion();
        revisarOrtografiaSuave();
      });
      chips.appendChild(btn);
    });

    const btnIgnorar = document.createElement("button");
    btnIgnorar.type = "button";
    btnIgnorar.className = "btn-ignorar";
    btnIgnorar.textContent = "Ignorar";
    btnIgnorar.addEventListener("click", () => {
      palabrasIgnoradas.add(palabraMal.toLowerCase());
      revisarOrtografiaSuave();
    });
    chips.appendChild(btnIgnorar);

    li.appendChild(chips);
    listaOrtografia.appendChild(li);
  });
}

btnCorregirTodo.addEventListener("click", () => {
  if (erroresOrtograficosActivos.length === 0) return;

  let texto = inputDescripcion.value;
  const ordenInverso = [...erroresOrtograficosActivos].sort(
    (a, b) => b.offset - a.offset,
  );

  ordenInverso.forEach((err) => {
    if (err.replacements && err.replacements.length > 0) {
      texto =
        texto.slice(0, err.offset) +
        err.replacements[0].value +
        texto.slice(err.offset + err.length);
    }
  });

  inputDescripcion.value = texto;
  inputDescripcion.focus();
  validarDescripcion();
  revisarOrtografiaSuave();
});

btnCerrarPanel.addEventListener("click", () => {
  panelLateral.classList.add("oculto");
});

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
  capaResaltado.textContent = inputDescripcion.value;
  validarDescripcion();
  clearTimeout(temporizadorOrtografia);
  temporizadorOrtografia = setTimeout(revisarOrtografiaSuave, 550);
});

function limpiarFormularioCompleto() {
  ["nombre", "correo", "descripcion"].forEach((id) => {
    const grupo = document.getElementById(`grupo-${id}`);
    const span = document.getElementById(`error-${id}`);
    grupo.classList.remove("valido", "invalido");
    span.textContent = "";
  });
  contadorDescripcion.textContent = `0 / ${LIMITE_DESCRIPCION}`;
  contadorDescripcion.classList.remove("excedido");
  palabrasIgnoradas.clear();
  ocultarPanelOrtografia();
}

// =========================================================
// 4. ENVÍO CON VALIDACIÓN DE LÍMITE Y ALERTAS
// =========================================================
formulario.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (tourActivo) {
    cerrarGuia(false);
  }

  // Alerta explícita si el texto supera el límite permitido
  if (inputNombre.value.trim().length > LIMITE_NOMBRE) {
    validarNombre();
    inputNombre.focus();
    Swal.fire({
      icon: "error",
      title: "Límite de caracteres superado",
      text: `El nombre no puede superar los ${LIMITE_NOMBRE} caracteres (actualmente tienes ${inputNombre.value.trim().length}).`,
      showCloseButton: true,
      confirmButtonText: "Corregir",
      confirmButtonColor: "#dc2626",
    });
    return;
  }

  if (inputDescripcion.value.length > LIMITE_DESCRIPCION) {
    validarDescripcion();
    inputDescripcion.focus();
    Swal.fire({
      icon: "error",
      title: "Límite de texto superado",
      text: `La descripción supera el límite máximo permitido de ${LIMITE_DESCRIPCION} caracteres (tienes ${inputDescripcion.value.length}). Por favor, acorta el texto antes de enviar.`,
      showCloseButton: true,
      confirmButtonText: "Entendido",
      confirmButtonColor: "#dc2626",
    });
    return;
  }

  const nombreOk = validarNombre();
  const correoOk = validarCorreo();
  const descripcionOk = validarDescripcion();

  if (!nombreOk || !correoOk || !descripcionOk) {
    if (!nombreOk) inputNombre.focus();
    else if (!correoOk) inputCorreo.focus();
    else inputDescripcion.focus();
    return;
  }

  boton.disabled = true;
  textoBotonEnviar.textContent = "ENVIANDO...";

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
    limpiarFormularioCompleto();

    Swal.fire({
      icon: "success",
      title: "¡Felicidades, aprendiste a enviar un correo!",
      text: "Tu mensaje fue enviado correctamente. Nos pondremos en contacto contigo pronto.",
      showCloseButton: true,
      showConfirmButton: true,
      confirmButtonText: "Aceptar",
      confirmButtonColor: "#6B6EB8",
      timer: 4000,
      timerProgressBar: true,
    });
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "Error al enviar",
      text: "Ocurrió un problema de conexión. Por favor, inténtalo nuevamente.",
      showCloseButton: true,
      confirmButtonText: "Cerrar",
      confirmButtonColor: "#dc2626",
    });
  } finally {
    boton.disabled = false;
    textoBotonEnviar.textContent = "ENVIAR";
  }
});
