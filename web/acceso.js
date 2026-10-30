'use strict';

// Entrada y salida de administradores (solo se carga en admin.html).
// El servidor guarda la sesión en una cookie HttpOnly: este código nunca ve la clave guardada.

(function () {
  const form = document.getElementById('formLogin');
  const campo = document.getElementById('inClave');
  const boton = document.getElementById('btnEntrar');
  const msg = document.getElementById('msgLogin');

  async function post(url, datos) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(datos).toString(),
      credentials: 'same-origin',
    });
  }

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    msg.textContent = '';
    if (!campo.value) {
      msg.textContent = 'Escribe la clave.';
      campo.focus();
      return;
    }
    boton.disabled = true;
    try {
      const resp = await post('/api/login', { clave: campo.value });
      const datos = await resp.json().catch(() => ({}));
      if (resp.ok) {
        campo.value = '';
        await sincronizar();
      } else {
        msg.textContent = datos.mensaje || 'No se pudo entrar.';
        campo.select();
      }
    } catch (e) {
      msg.textContent = 'No se pudo contactar con el servidor.';
    } finally {
      boton.disabled = false;
    }
  });

  document.getElementById('btnSalir').addEventListener('click', async () => {
    try { await post('/api/logout', {}); } catch (_) { /* da igual */ }
    await sincronizar();
  });
})();
