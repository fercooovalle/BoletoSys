const fs = require('fs');
const path = require('path');
const { Boleto, ListaZonas, Pila } = require('../models/estructuras');
const { generarQR } = require('../utils/qrGenerator');


const carpetaData = path.join(__dirname, '..', 'data');
if (!fs.existsSync(carpetaData)) {
  fs.mkdirSync(carpetaData);
}

const archivoTransacciones = path.join(carpetaData, 'transacciones.json');
if (!fs.existsSync(archivoTransacciones)) {
  // Si no existe el archivo, lo creamos con un arreglo vacío
  fs.writeFileSync(archivoTransacciones, JSON.stringify([], null, 2), 'utf-8');
}


const zonas = new ListaZonas();
zonas.agregarZona('VIP', 20);
zonas.agregarZona('Tribuna', 20);
zonas.agregarZona('General', 20);

const pilaCancelados = new Pila();


const comprarBoleto = async (req, res) => {
  try {
    const { nombre, zona, asiento } = req.body;

    // Validar que vengan los datos obligatorios
    if (!nombre || !zona || asiento == null) {
      return res.status(400).json({ error: 'Faltan datos obligatorios: nombre, zona o asiento.' });
    }

    // Buscar la zona indicada
    const zonaData = zonas.encontrarZona(zona.toLowerCase());
    if (!zonaData) {
      return res.status(404).json({ error: 'Zona no encontrada.' });
    }

    // Verificar que esa zona aún tenga asientos disponibles
    if (zonaData.disponibles <= 0) {
      return res.status(400).json({ error: 'No hay boletos disponibles en esta zona.' });
    }

    // Verificar que el asiento no esté ya ocupado
    if (zonaData.asientosOcupados.includes(asiento)) {
      return res.status(400).json({ error: 'Asiento ya ocupado.' });
    }

    // ──────── CREAMOS UN OBJETO NUEVO DE BOLETO ────────
    // En este momento nos aseguramos de que "asiento" y "zona" son los que efectivamente seleccionó el usuario.
    const boleto = new Boleto(nombre, zona, asiento);

    // Asignar número correlativo (cantidad actual de boletos + 1)
    // Leemos el JSON completo para saber cuántos había antes
    const transPrevias = JSON.parse(fs.readFileSync(archivoTransacciones, 'utf-8'));
    boleto.numero = transPrevias.length + 1;

    // Registrar el asiento como ocupado en esa zona
    zonaData.asientosOcupados.push(asiento);
    zonaData.disponibles--;

    const qrPath = await generarQR(boleto);
    boleto.qrPath = qrPath; // algo como '/qrs/qr-5.png'

    // ──────── GUARDAR EN JSON ────────
    transPrevias.push(boleto);
    fs.writeFileSync(archivoTransacciones, JSON.stringify(transPrevias, null, 2), 'utf-8');

    // ──────── RESPONDER AL CLIENTE ────────
    return res.status(201).json({
      mensaje: 'Compra exitosa',
      boleto
    });

  } catch (error) {
    console.error('Error en comprarBoleto:', error);
    return res.status(500).json({ error: 'Error interno al procesar la compra.' });
  }
};



const cancelarBoleto = (req, res) => {
  try {
    const { numero } = req.body;

    if (numero == null) {
      return res.status(400).json({ error: 'Falta el número del boleto a cancelar.' });
    }

    // Leemos todas las transacciones
    const transacciones = JSON.parse(fs.readFileSync(archivoTransacciones, 'utf-8'));

    // Buscamos el índice del boleto con ese número
    const idx = transacciones.findIndex(b => b.numero === numero);
    if (idx === -1) {
      return res.status(404).json({ error: 'Boleto no encontrado.' });
    }

    // Extraemos el boleto para devolverlo
    const boletoCancelado = transacciones.splice(idx, 1)[0];

    // Liberamos el asiento en la zona correspondiente
    const zonaData = zonas.encontrarZona(boletoCancelado.zona.toLowerCase());
    if (zonaData) {
      zonaData.disponibles++;
      zonaData.asientosOcupados = zonaData.asientosOcupados.filter(a => a !== boletoCancelado.asiento);
    }

    // Guardamos el JSON sin el boleto cancelado
    fs.writeFileSync(archivoTransacciones, JSON.stringify(transacciones, null, 2), 'utf-8');

    // Apilamos el boleto en la pila "pilaCancelados"
    pilaCancelados.apilar(boletoCancelado);

    // Eliminar el QR del boleto cancelado
    if (boletoCancelado.qrPath) {
    const rutaQR = path.join(__dirname, '..', 'public', boletoCancelado.qrPath);
    if (fs.existsSync(rutaQR)) {
        fs.unlinkSync(rutaQR); 
    }
    }

    return res.status(200).json({
      mensaje: 'Boleto cancelado correctamente',
      cancelado: boletoCancelado
    });

  } catch (error) {
    console.error('Error en cancelarBoleto:', error);
    return res.status(500).json({ error: 'Error interno al cancelar boleto.' });
  }
};



const reasignarBoleto = async (req, res) => {
  try {
    const { nuevoNombre } = req.body;
    if (!nuevoNombre) {
      return res.status(400).json({ error: 'Debes proporcionar un nuevo nombre para reasignar el boleto.' });
    }

    if (pilaCancelados.estaVacia()) {
      return res.status(400).json({ error: 'No hay boletos cancelados para reasignar.' });
    }

    // Sacamos el boleto más reciente de la pila
    const boleto = pilaCancelados.desapilar();

    // Actualizar nombre y fecha/hora
    boleto.nombre = nuevoNombre;
    boleto.fechaHora = new Date().toLocaleString();

    // Generar un QR nuevo con los datos actualizados
    const nuevoQrPath = await generarQR(boleto);
    boleto.qrPath = nuevoQrPath;

    // Volver a registrar el asiento como ocupado en su zona
    const zonaData = zonas.encontrarZona(zona.toLowerCase());
    if (zonaData) {
      zonaData.asientosOcupados.push(boleto.asiento);
      zonaData.disponibles--;
    }

    // Guardar en el JSON de transacciones
    const transacciones = JSON.parse(fs.readFileSync(archivoTransacciones, 'utf-8'));
    transacciones.push(boleto);
    fs.writeFileSync(archivoTransacciones, JSON.stringify(transacciones, null, 2), 'utf-8');

    return res.status(200).json({
      mensaje: 'Boleto reasignado exitosamente',
      boleto
    });

  } catch (error) {
    console.error('Error en reasignarBoleto:', error);
    return res.status(500).json({ error: 'Error interno al reasignar boleto.' });
  }
};


const obtenerBoletos = (req, res) => {
  try {
    const transacciones = JSON.parse(fs.readFileSync(archivoTransacciones, 'utf-8'));
    return res.status(200).json({
      total: transacciones.length,
      boletos: transacciones
    });
  } catch (error) {
    console.error('Error en obtenerBoletos:', error);
    return res.status(500).json({ error: 'Error al leer los boletos.' });
  }
};


module.exports = {
  comprarBoleto,
  cancelarBoleto,
  reasignarBoleto,
  obtenerBoletos
};
