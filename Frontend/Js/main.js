document.addEventListener("DOMContentLoaded", () => {
  const botonesAsiento = document.querySelectorAll(".seat-btn");
  const contadorBoletos = document.getElementById("contador-boletos");
  const totalBoletos = document.getElementById("total-boletos");
  const btnCompra = document.getElementById("btnCompra");
  const form = document.getElementById("formCliente");
  const btnCancelar = document.getElementById("btnCancelar");

  let boletosSeleccionados = 0;
  const selectedSeats = [];
  let ultimosBoletos = [];
  let ultimoBoletoNumero = [];

  const precios = {
    VIP: 150,
    TRIBUNA: 100,
    GENERAL: 50
  };

  window.mostrarZona = function (zonaId) {
    document.querySelectorAll(".zone").forEach((z) => z.style.display = "none");
    const zona = document.getElementById(zonaId);
    if (zona) zona.style.display = "block";

    selectedSeats.forEach((asiento) => {
      if (asiento.zona.toLowerCase() === zonaId.toLowerCase()) {
        zona.querySelectorAll(".seat-btn").forEach((btn) => {
          if (btn.textContent.trim() === asiento.numero) {
            btn.classList.add("seleccionado");
          }
        });
      }
    });
  };

  botonesAsiento.forEach((boton) => {
    boton.addEventListener("click", () => {
      const zonaDiv = boton.closest(".zone");
      let zonaNombre = zonaDiv.classList.contains("vip") ? "VIP" :
                       zonaDiv.classList.contains("tribuna") ? "TRIBUNA" : "GENERAL";

      const numeroAsiento = boton.textContent.trim();
      const asientoId = `${zonaNombre}-${numeroAsiento}`;
      const idx = selectedSeats.findIndex((a) => a.id === asientoId);

      if (idx !== -1) {
        selectedSeats.splice(idx, 1);
        boletosSeleccionados--;
        boton.classList.remove("seleccionado");
      } else {
        selectedSeats.push({
          id: asientoId,
          zona: zonaNombre,
          numero: numeroAsiento,
          precio: precios[zonaNombre]
        });
        boletosSeleccionados++;
        boton.classList.add("seleccionado");
      }

      contadorBoletos.textContent = boletosSeleccionados;
      totalBoletos.textContent = selectedSeats.reduce((acc, s) => acc + s.precio, 0);
    });
  });

  btnCompra.addEventListener("click", () => {
    if (selectedSeats.length === 0) {
      alert("Debe seleccionar al menos un asiento.");
      return;
    }

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

    const compraModal = new bootstrap.Modal(document.getElementById("compraModal"));
    compraModal.show();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cliente = {
      nombre: document.getElementById("nombre").value.trim(),
      correo: document.getElementById("correo").value.trim(),
      telefono: document.getElementById("telefono").value.trim()
    };

    ultimosBoletos = [];
    ultimoBoletoNumero = [];

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

          const btn = Array.from(botonesAsiento).find((b) => {
            const zDiv = b.closest(".zone");
            let zN = zDiv.classList.contains("vip") ? "VIP" :
                     zDiv.classList.contains("tribuna") ? "TRIBUNA" : "GENERAL";
            return zN === asiento.zona && b.textContent.trim() === asiento.numero;
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

    const qrContainer = document.getElementById("qrContainer");
    qrContainer.innerHTML = "";
    ultimosBoletos.forEach((boleto) => {
      if (boleto.qrPath) {
        const img = document.createElement("img");
        img.src = boleto.qrPath;
        img.alt = "QR";
        img.classList.add("qr-img");
        qrContainer.appendChild(img);
      }
    });

    bootstrap.Modal.getInstance(document.getElementById("compraModal")).hide();
    new bootstrap.Modal(document.getElementById("resumenModal")).show();
    resetSeleccion();
  });

  btnCancelar.addEventListener("click", async () => {
    if (ultimoBoletoNumero.length === 0) {
      alert("No hay boletos para cancelar.");
      return;
    }

    const confirmar = confirm("¿Confirmas cancelar TODOS los boletos comprados?");
    if (!confirmar) return;

    try {
      for (const numero of ultimoBoletoNumero) {
        await fetch("http://localhost:3000/api/cancelar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numero })
        });
      }

      alert("Compra cancelada correctamente.");

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

      bootstrap.Modal.getInstance(document.getElementById("resumenModal")).hide();
      resetSeleccion();
      ultimosBoletos = [];
      ultimoBoletoNumero = [];
    } catch (err) {
      console.error("Error al cancelar:", err);
      alert("Ocurrió un error al cancelar la compra.");
    }
  });

  function resetSeleccion() {
    selectedSeats.length = 0;
    boletosSeleccionados = 0;
    contadorBoletos.textContent = "0";
    totalBoletos.textContent = "0";
    botonesAsiento.forEach((b) => b.classList.remove("seleccionado"));
  }

  mostrarZona("vip");
});
