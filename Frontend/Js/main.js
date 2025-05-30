document.addEventListener("DOMContentLoaded", () => {
  const botonesAsiento = document.querySelectorAll(".seat-btn");
  const contadorBoletos = document.getElementById("contador-boletos");
  const totalBoletos = document.getElementById("total-boletos");

  let boletosSeleccionados = 0;
  const selectedSeats = [];

  // Define precios por zona
  const precios = {
    VIP: 150,
    TRIBUNA: 100,
    GENERAL: 50,
  };

  // Manejar selección asientos
  botonesAsiento.forEach((boton) => {
    boton.addEventListener("click", () => {
      const zonaDiv = boton.closest(".zone");
      const zonaNombre = zonaDiv.classList.contains("vip")
        ? "VIP"
        : zonaDiv.classList.contains("tribuna")
        ? "TRIBUNA"
        : "GENERAL";

      const numeroAsiento = boton.textContent.trim();
      const asientoId = `${zonaNombre}-${numeroAsiento}`;

      const index = selectedSeats.findIndex((asiento) => asiento.id === asientoId);

      if (index !== -1) {
        // Deseleccionar asiento
        selectedSeats.splice(index, 1);
        boletosSeleccionados--;
        boton.classList.remove("btn-dark", "seleccionado");
      } else {
        // Seleccionar asiento
        selectedSeats.push({
          id: asientoId,
          zona: zonaNombre,
          numero: numeroAsiento,
          precio: precios[zonaNombre],
        });
        boletosSeleccionados++;
        boton.classList.add("btn-dark", "seleccionado");
      }

      contadorBoletos.textContent = boletosSeleccionados;

      // Calcular total
      const total = selectedSeats.reduce((acc, seat) => acc + seat.precio, 0);
      if (totalBoletos) {
        totalBoletos.textContent = total;
      }

      console.log("Asientos seleccionados:", selectedSeats);
    });
  });

  // Botón Compra: abre modal solo si hay asientos seleccionados
  const btnCompra = document.getElementById("btnCompra");
  if (btnCompra) {
    btnCompra.addEventListener("click", () => {
  if (selectedSeats.length === 0) {
    alert("Debe seleccionar al menos un asiento para continuar.");
    return;
  }

 // Actualizar la lista de asientos en el modal
const listaAsientos = document.getElementById("resumenAsientos");
const totalResumen = document.getElementById("resumenTotal");

listaAsientos.innerHTML = ""; // Limpiar lista previa
let total = 0;

selectedSeats.forEach((asiento) => {
  const li = document.createElement("li");
  li.className = "list-group-item";
  li.textContent = `${asiento.zona} - Asiento ${asiento.numero} ($${asiento.precio})`;
  listaAsientos.appendChild(li);
  total += asiento.precio;
});

totalResumen.textContent = total;

  const compraModal = new bootstrap.Modal(document.getElementById("compraModal"));
  compraModal.show();
});

  }

  // Manejar envío del formulario
  const form = document.getElementById("formCliente");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const cliente = {
        nombre: document.getElementById("nombre").value,
        correo: document.getElementById("correo").value,
        telefono: document.getElementById("telefono").value,
      };

      // Llenar modal resumen
      document.getElementById("resumenNombre").textContent = cliente.nombre;
      document.getElementById("resumenCorreo").textContent = cliente.correo;
      document.getElementById("resumenTelefono").textContent = cliente.telefono;

      const resumenAsientos = document.getElementById("resumenAsientos");
      resumenAsientos.innerHTML = "";
      let totalResumen = 0;

      selectedSeats.forEach((asiento) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = `${asiento.zona} - Asiento ${asiento.numero} ($${asiento.precio})`;
        resumenAsientos.appendChild(li);
        totalResumen += asiento.precio;
      });

      document.getElementById("resumenTotal").textContent = totalResumen;

      // Cerrar modal compra
      const modalCompra = bootstrap.Modal.getInstance(document.getElementById("compraModal"));
      modalCompra.hide();

      // Mostrar modal resumen
      const resumenModal = new bootstrap.Modal(document.getElementById("resumenModal"));
      resumenModal.show();
    });
  }
});
