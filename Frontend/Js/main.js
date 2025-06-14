// Al inicio del archivo main.js
let botonesArray = []; // Declaración GLOBAL
let focoIndex = 0;

let currentIndex = 0;
let currentZone = "vip"; // Puedes cambiar esto dinámicamente

function resaltarBoton(index) {
  if (!Array.isArray(botonesArray) || botonesArray.length === 0) return;

  botonesArray.forEach((btn, i) => {
    if (i === index) {
      btn.classList.add("resaltado");
      btn.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      btn.classList.remove("resaltado");
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {

   const socket = io();
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
  document.querySelectorAll(".zone").forEach((z) => {
    z.style.display = "none";
  });

  const zona = document.getElementById(zonaId);
  if (zona) zona.style.display = "block";

  selectedSeats.forEach((asiento) => {
    const zonaLower = zonaId.toLowerCase();
    if (asiento.zona.toLowerCase() === zonaLower) {
      zona.querySelectorAll(".seat-btn").forEach((btn) => {
        if (btn.textContent.trim() === asiento.numero) {
          btn.classList.add("seleccionado");
        }
      });
    }
  });

  
  botonesArray = Array.from(zona.querySelectorAll(".seat-btn")).filter(
    (b) => !b.disabled
  );
  focoIndex = 0; // reinicia al primer asiento disponible
  resaltarBoton(focoIndex); // enfocar el primer botón
};


  botonesAsiento.forEach((boton) => {
    boton.addEventListener("click", () => {
      const zonaDiv = boton.closest(".zone");
      let zonaNombre = "";
      if (zonaDiv.classList.contains("vip")) zonaNombre = "VIP";
      else if (zonaDiv.classList.contains("tribuna")) zonaNombre = "TRIBUNA";
      else if (zonaDiv.classList.contains("general")) zonaNombre = "GENERAL";

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
      const suma = selectedSeats.reduce((acc, s) => acc + s.precio, 0);
      totalBoletos.textContent = suma;
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

    const compraModal = new bootstrap.Modal(
      document.getElementById("compraModal")
    );
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

    bootstrap.Modal.getInstance(
      document.getElementById("compraModal")
    ).hide();
    const resumenModal = new bootstrap.Modal(
      document.getElementById("resumenModal")
    );
    resumenModal.show();

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
      // Enviar cancelación de cada boleto al backend
      for (const numero of ultimoBoletoNumero) {
        await fetch("http://localhost:3000/api/cancelar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ numero })
        });
      }
      alert("compra cancelada correctamente.");

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
      alert("rió un error al cancelar la compra.");
    }
  });

  function resetSeleccion() {
    selectedSeats.length = 0;
    boletosSeleccionados = 0;
    contadorBoletos.textContent = "0";
    totalBoletos.textContent = "0";
    botonesAsiento.forEach((b) => b.classList.remove("seleccionado"));
  }
    // Al final del DOMContentLoaded:
mostrarZona("vip"); // <-- Esto inicializa correctamente botonesArray y focoIndex


socket.on('arduino-command', (data) => {
  console.log('CLIENTE recibió comando del servidor:', data);
  let cmd = '';

  if (typeof data === 'object') {
    if (data[""]) {
      cmd = data[""];
    } else if (data.BUTTON) {
      cmd = data.BUTTON;
    }
  } else if (typeof data === 'string') {
    cmd = data;
  }

  cmd = cmd.trim().toUpperCase();
  console.log('Comando procesado:', cmd);

  if (botonesArray.length === 0) return;
    console.log('botonesArray tiene:', botonesArray.length, 'botones');

  switch (cmd) {
    case 'LEFT':
      focoIndex = (focoIndex - 1 + botonesArray.length) % botonesArray.length;
      break;
    case 'RIGHT':
      focoIndex = (focoIndex + 1) % botonesArray.length;
      break;
    case 'ENTER':
      botonesArray[focoIndex].click();
      break;
    default:
      console.log('Comando no reconocido:', cmd);
      return;
  }

  resaltarBoton(focoIndex);
});




botonesArray = Array.from(document.querySelectorAll(".seat-btn"));

mostrarZona("vip"); 



});
