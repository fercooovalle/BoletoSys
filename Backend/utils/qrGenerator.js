const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const generarQR = async (boleto) => {
    const contenido = `Boleto No. ${boleto.numero}\nNombre: ${boleto.nombre}\nZona: ${boleto.zona}\nAsiento: ${boleto.asiento}`;
    const nombreArchivo = `qr_boleto_${boleto.numero}.png`;
    const rutaCarpeta = path.join(__dirname, '..', 'qrs');

    if (!fs.existsSync(rutaCarpeta)) {
        fs.mkdirSync(rutaCarpeta);
    }

    const rutaCompleta = path.join(rutaCarpeta, nombreArchivo);

    try {
        await QRCode.toFile(rutaCompleta, contenido);
        return `/backend/qrs/${nombreArchivo}`;
    } catch (err) {
        console.error('Error al generar QR:', err);
        return null;
    }
};

module.exports = { generarQR };
