// Archivo: js/main.js

document.addEventListener("DOMContentLoaded", () => {
  // ===== REFERENCIAS A ELEMENTOS =====
  const botonesAsiento = document.querySelectorAll(".seat-btn");
  const contadorBoletos = document.getElementById("contador-boletos");
  const totalBoletos = document.getElementById("total-boletos");
  const btnCompra = document.getElementById("btnCompra");
  const form = document.getElementById("formCliente");
  const btnCancelar = document.getElementById("btnCancelar");

  // ===== ESTADO INTERNO =====
  let boletosSeleccionados = 0;
  const selectedSeats = [];      // [{ id: "VIP-3", zona:"VIP", numero:"3", precio:150 }, …]
  let ultimosBoletos = [];       // Array de objetos recibidos del backend (cada boleto con qrPath, número, etc.)
  let ultimoBoletoNumero = [];   // Array de números de boleto que acabo de comprar

  // Precios por zona
  const precios = {
    VIP: 150,
    TRIBUNA: 100,
    GENERAL: 50
  };



  // ===== FUNCIÓN PARA MOSTRAR/OCULTAR ZONAS =====
  window.mostrarZona = function (zonaId) {
    // 1) Ocultar todas las zonas
    document.querySelectorAll(".zone").forEach((z) => {
      z.style.display = "none";
    });

    // 2) Mostrar solo la zona seleccionada
    const zona = document.getElementById(zonaId);
    if (zona) zona.style.display = "block";

    // 3) Si hay asientos ya seleccionados en esa zona, marcarlos como “seleccionado”
    selectedSeats.forEach((asiento) => {
      const zonaLower = zonaId.toLowerCase();
      if (asiento.zona.toLowerCase() === zonaLower) {
        // Busco todos los botones .seat-btn dentro de esa zona
        zona.querySelectorAll(".seat-btn").forEach((btn) => {
          if (btn.textContent.trim() === asiento.numero) {
            btn.classList.add("seleccionado");
          }
        });
      }
    });
  };

  // ===== SELECCIÓN / DESELECCIÓN DE ASIENTOS =====
  botonesAsiento.forEach((boton) => {
    boton.addEventListener("click", () => {
      // 1) Determinar la zona “física” (VIP/Tribuna/General) del botón
      const zonaDiv = boton.closest(".zone");
      let zonaNombre = "";
      if (zonaDiv.classList.contains("vip")) zonaNombre = "VIP";
      else if (zonaDiv.classList.contains("tribuna")) zonaNombre = "TRIBUNA";
      else if (zonaDiv.classList.contains("general")) zonaNombre = "GENERAL";

      // 2) Obtener el número de asiento (texto del botón)
      const numeroAsiento = boton.textContent.trim();
      const asientoId = `${zonaNombre}-${numeroAsiento}`;

      // 3) Verificar si ya estaba seleccionado
      const idx = selectedSeats.findIndex((a) => a.id === asientoId);
      if (idx !== -1) {
        // Ya estaba → lo quitamos
        selectedSeats.splice(idx, 1);
        boletosSeleccionados--;
        boton.classList.remove("seleccionado");
      } else {
        // No estaba → lo agregamos
        selectedSeats.push({
          id: asientoId,
          zona: zonaNombre,
          numero: numeroAsiento,
          precio: precios[zonaNombre]
        });
        boletosSeleccionados++;
        boton.classList.add("seleccionado");
      }

      // 4) Actualizar contador y total en pantalla
      contadorBoletos.textContent = boletosSeleccionados;
      const suma = selectedSeats.reduce((acc, s) => acc + s.precio, 0);
      totalBoletos.textContent = suma;
    });
  });

  // ===== BOTÓN “Confirmar Compra” =====
  btnCompra.addEventListener("click", () => {
    if (selectedSeats.length === 0) {
      alert("Debe seleccionar al menos un asiento.");
      return;
    }

    // 1) Llenar la lista de asientos dentro del modal “Confirma tu Compra”
    const listaAsientos = document.getElementById("resumenAsientos");
    const totalResumen = document.getElementById("resumenTotal");
    listaAsientos.innerHTML = "";
    let suma = 0;

    selectedSeats.forEach((s) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `${s.zona} – Asiento ${s.numero} (Q${s.precio})`;
      listaAsientos.appendChild(li);
      suma += s.precio;
    });
    totalResumen.textContent = suma;

    // 2) Mostrar el modal de confirmación
    const compraModal = new bootstrap.Modal(
      document.getElementById("compraModal")
    );
    compraModal.show();
  });

  // ===== ENVÍO DEL FORMULARIO DENTRO DEL MODAL (FINALIZAR COMPRA) =====
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // 1) Obtener datos del cliente
    const cliente = {
      nombre: document.getElementById("nombre").value.trim(),
      correo: document.getElementById("correo").value.trim(),
      telefono: document.getElementById("telefono").value.trim()
    };

    // 2) Resetear arrays de compras previas
    ultimosBoletos = [];
    ultimoBoletoNumero = [];

    // 3) Por cada asiento seleccionado, enviar un POST /api/comprar
    for (const asiento of selectedSeats) {
      const payload = {
        nombre: cliente.nombre,
        zona: asiento.zona,
        asiento: parseInt(asiento.numero),
        prioridad: false
      };

      try {
        const response = await fetch("http://localhost:3000/api/comprar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const resultado = await response.json();

        if (response.ok && resultado.boleto) {
          ultimosBoletos.push(resultado.boleto);
          ultimoBoletoNumero.push(resultado.boleto.numero);

          // Deshabilitar el botón de ese asiento comprado
          const btn = Array.from(botonesAsiento).find((b) => {
            const zDiv = b.closest(".zone");
            let zN = "";
            if (zDiv.classList.contains("vip")) zN = "VIP";
            else if (zDiv.classList.contains("tribuna")) zN = "TRIBUNA";
            else if (zDiv.classList.contains("general")) zN = "GENERAL";
            return (
              zN === asiento.zona && b.textContent.trim() === asiento.numero
            );
          });
          if (btn) {
            btn.disabled = true;
            btn.classList.remove("seleccionado");
          }
        }
      } catch (err) {
        console.error("Error al comprar asiento:", err);
      }
    }

    // 4) Llenar modal “Resumen de la Compra” con datos del cliente y asientos
    document.getElementById("resumenNombre").textContent = cliente.nombre;
    document.getElementById("resumenCorreo").textContent = cliente.correo;
    document.getElementById("resumenTelefono").textContent = cliente.telefono;

    const resumenAsientosFinal = document.getElementById("resumenAsientosFinal");
    resumenAsientosFinal.innerHTML = "";
    let totalFinal = 0;
    selectedSeats.forEach((s) => {
      const li = document.createElement("li");
      li.className = "list-group-item";
      li.textContent = `${s.zona} – Asiento ${s.numero} (Q${s.precio})`;
      resumenAsientosFinal.appendChild(li);
      totalFinal += s.precio;
    });
    document.getElementById("resumenTotalFinal").textContent = totalFinal;

    // 5) Insertar todas las imágenes QR dentro de #qrContainer
    const qrContainer = document.getElementById("qrContainer");
    qrContainer.innerHTML = "";
    ultimosBoletos.forEach((boleto) => {
      if (boleto.qrPath) {
        const img = document.createElement("img");
        img.src = boleto.qrPath; // ruta que vino del backend
        img.alt = "QR";
        img.classList.add("qr-img");
        qrContainer.appendChild(img);
      }
    });

    // 6) Cerrar el modal “Confirma tu Compra” y abrir “Resumen de la Compra”
    bootstrap.Modal.getInstance(
      document.getElementById("compraModal")
    ).hide();
    const resumenModal = new bootstrap.Modal(
      document.getElementById("resumenModal")
    );
    resumenModal.show();

    // 7) Limpiar selección para futuras compras
    resetSeleccion();
  });

  // ===== BOTÓN “Cancelar Compra” DENTRO DEL MODAL “Resumen de la Compra” =====
  btnCancelar.addEventListener("click", async () => {
    if (ultimoBoletoNumero.length === 0) {
      alert("No hay boletos para cancelar.");
      return;
    }
    const confirmar = confirm("¿Confirmas cancelar TODOS los boletos comprados?");
    if (!confirmar) return;

    try {
      // Enviar cancelación de cada boleto al backend
      for (const numero of ultimoBoletoNumero) {
        await fetch("http://localhost:3000/api/cancelar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numero })
        });
      }
      alert("✅ Compra cancelada correctamente.");

      // Habilitar los botones de los asientos cancelados
ultimoBoletoNumero.forEach((nro) => {
  const boleto = ultimosBoletos.find((b) => b.numero === nro);
  if (boleto) {
    const zonaClase = boleto.zona.toLowerCase();
    const zonaDiv = document.querySelector(`.zone.${zonaClase}`);
    if (zonaDiv) {
      const btn = Array.from(zonaDiv.querySelectorAll(".seat-btn")).find(
        (b) => b.textContent.trim() === String(boleto.asiento)
      );
      if (btn) {
        btn.disabled = false;
        btn.classList.remove("seleccionado", "btn-secondary");
      }
    }
  }
});

      // Cerrar el modal “Resumen de la Compra”
      bootstrap.Modal.getInstance(
        document.getElementById("resumenModal")
      ).hide();

      // Limpiar selección visual y arrays
      resetSeleccion();
      ultimosBoletos = [];
      ultimoBoletoNumero = [];
    } catch (err) {
      console.error("Error al cancelar:", err);
      alert("Ocurrió un error al cancelar la compra.");
    }
  });

  // ===== FUNCIÓN PARA REINICIAR SELECCIÓN =====
  function resetSeleccion() {
    selectedSeats.length = 0;
    boletosSeleccionados = 0;
    contadorBoletos.textContent = "0";
    totalBoletos.textContent = "0";
    botonesAsiento.forEach((b) => b.classList.remove("seleccionado"));
  }
    mostrarZona("vip");

});
