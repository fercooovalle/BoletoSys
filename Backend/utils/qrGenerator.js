const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

// Asegura que exista la carpeta de salida
const carpetaQR = path.join(__dirname, '..', 'public', 'qrs');
if (!fs.existsSync(carpetaQR)) {
  fs.mkdirSync(carpetaQR, { recursive: true });
}

const generarQR = async (boleto) => {
  const contenido = `Boleto No. ${boleto.numero}
Nombre: ${boleto.nombre}
Zona: ${boleto.zona}
Asiento: ${boleto.asiento}
Fecha: ${boleto.fechaHora}`;

  const nombreArchivo = `qr-${boleto.numero}-${Date.now()}.png`;
  const rutaCompleta = path.join(carpetaQR, nombreArchivo);

  await QRCode.toFile(rutaCompleta, contenido);
  return `/qrs/${nombreArchivo}`;
};

module.exports = { generarQR };