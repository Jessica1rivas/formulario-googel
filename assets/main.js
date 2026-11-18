const URL_SCRIPT =
  "https://script.google.com/macros/s/AKfycbwg6OWKV-I3Fu3GOl8xsOa-rEC9lNC_3G0ICm4CRdwwFvnSh0J9XIpO0WId6lyfNGLM/exec";

const formulario = document.getElementById("formularioContacto");
const boton = document.getElementById("btnEnviar");
const estado = document.getElementById("estadoMensaje");

formulario.addEventListener("submit", async function (e) {
  e.preventDefault();

  if (!formulario.reportValidity()) {
    return;
  }

  boton.disabled = true;
  boton.textContent = "Enviando...";
  estado.textContent = "Procesando tu mensaje...";
  estado.className = "";

  try {
    const datos = new URLSearchParams(new FormData(formulario));

    await fetch(URL_SCRIPT, {
      method: "POST",
      mode: "no-cors",
      body: datos,
    });

    // En no-cors no podemos leer la respuesta del servidor.
    // Por eso no afirmamos que el registro se haya confirmado.

    estado.textContent =
      "Solicitud enviada. Revisa tu correo o contacta al administrador si no recibes confirmación.";

    estado.className = "exito";

    formulario.reset();
  } catch (error) {
    console.error(error);

    estado.textContent =
      "No se pudo enviar la solicitud. Inténtalo nuevamente.";

    estado.className = "error";
  } finally {
    boton.disabled = false;
    boton.textContent = "Enviar mensaje";
  }
});


