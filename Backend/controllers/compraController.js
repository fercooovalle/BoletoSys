const fs = require('fs');
const path = require('path');
const { Boleto, ListaZonas, Cola, Pila } = require('../models/estructuras');
const { generarQR } = require('../utils/qrGenerator');

// Estructuras globales en memoria
const zonas = new ListaZonas();
zonas.agregarZona("VIP", 5);
zonas.agregarZona("Tribuna", 10);
zonas.agregarZona("General", 15);

const colaCompras = new Cola();
const pilaCancelados = new Pila();

// Ruta del archivo JSON donde se guardan los boletos
const archivoTransacciones = path.join(__dirname, '..', 'data', 'transacciones.json');

const carpetaData = path.join(__dirname, '..', 'data');
if (!fs.existsSync(carpetaData)) {
    fs.mkdirSync(carpetaData);
}

// Crear archivo si no existe
if (!fs.existsSync(archivoTransacciones)) {
    fs.writeFileSync(archivoTransacciones, JSON.stringify([]));
}


// 🟢 POST /comprar
const comprarBoleto = async (req, res) => {
    try {
        const { nombre, zona, asiento } = req.body;

        if (!nombre || !zona || asiento == null) {
            return res.status(400).json({ error: 'Faltan datos obligatorios.' });
        }

        const zonaEncontrada = zonas.encontrarZona(zona);
        if (!zonaEncontrada) {
            return res.status(404).json({ error: 'Zona no encontrada.' });
        }

        if (zonaEncontrada.disponibles <= 0) {
            return res.status(400).json({ error: 'No hay boletos disponibles en esta zona.' });
        }

        if (zonaEncontrada.asientosOcupados.includes(asiento)) {
            return res.status(400).json({ error: 'Asiento ya ocupado.' });
        }

        // Crear boleto y encolar
        const boleto = new Boleto(nombre, zona, asiento);
        const prioridad = req.body.prioridad === true;
        colaCompras.encolar(boleto, prioridad);


        // Procesar compra de inmediato (simulado)
        const procesado = colaCompras.desencolar();
        zonaEncontrada.asientosOcupados.push(asiento);
        zonaEncontrada.disponibles--;

        
        // Generar QR
        const datosPrevios = JSON.parse(fs.readFileSync(archivoTransacciones));
        procesado.numero = datosPrevios.length + 1;

        // Generar QR
        const qrPath = await generarQR(procesado);
        procesado.qrPath = qrPath;

        // Guardar en archivo
        datosPrevios.push(procesado);
        fs.writeFileSync(archivoTransacciones, JSON.stringify(datosPrevios, null, 2));


        return res.status(201).json({
            mensaje: 'Compra exitosa',
            boleto: procesado
        });

    } catch (err) {
        console.error('Error en compra:', err);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
};

const cancelarBoleto = (req, res) => {
    try {
        const { numero } = req.body;
        if (!numero) {
            return res.status(400).json({ error: 'Falta el número del boleto a cancelar.' });
        }

        // Leer archivo de transacciones
        const transacciones = JSON.parse(fs.readFileSync(archivoTransacciones));

        // Buscar boleto por número
        const index = transacciones.findIndex(b => b.numero === numero);
        if (index === -1) {
            return res.status(404).json({ error: 'Boleto no encontrado.' });
        }

        const boletoCancelado = transacciones.splice(index, 1)[0]; // eliminar y obtener

        // Liberar asiento
        const zona = zonas.encontrarZona(boletoCancelado.zona);
        if (zona) {
            zona.disponibles++;
            zona.asientosOcupados = zona.asientosOcupados.filter(a => a !== boletoCancelado.asiento);
        }

        // Guardar cambios en archivo
        fs.writeFileSync(archivoTransacciones, JSON.stringify(transacciones, null, 2));

        // Guardar boleto en pila
        pilaCancelados.apilar(boletoCancelado);

        return res.status(200).json({
            mensaje: 'Boleto cancelado correctamente',
            cancelado: boletoCancelado
        });

    } catch (err) {
        console.error('Error al cancelar boleto:', err);
        return res.status(500).json({ error: 'Error interno al cancelar.' });
    }
};

const reasignarBoleto = async (req, res) => {
    try {
        const { nuevoNombre } = req.body;

        if (!nuevoNombre) {
            return res.status(400).json({ error: 'Debes proporcionar un nuevo nombre para reasignar el boleto.' });
        }

        if (pilaCancelados.estaVacia()) {
            return res.status(400).json({ error: 'No hay boletos cancelados disponibles para reasignar.' });
        }

        // Sacar el boleto cancelado más reciente
        const boleto = pilaCancelados.desapilar();

        // Asignar nuevo nombre y nueva fecha/hora
        boleto.nombre = nuevoNombre;
        boleto.fechaHora = new Date().toLocaleString();

        // Generar nuevo QR
        const qrPath = await generarQR(boleto);
        boleto.qrPath = qrPath;

        // Volver a asignar asiento
        const zona = zonas.encontrarZona(boleto.zona);
        if (zona) {
            zona.asientosOcupados.push(boleto.asiento);
            zona.disponibles--;
        }

        // Guardar en archivo
        const transacciones = JSON.parse(fs.readFileSync(archivoTransacciones));
        transacciones.push(boleto);
        fs.writeFileSync(archivoTransacciones, JSON.stringify(transacciones, null, 2));

        return res.status(200).json({
            mensaje: 'Boleto reasignado exitosamente',
            boleto
        });

    } catch (err) {
        console.error('Error al reasignar boleto:', err);
        return res.status(500).json({ error: 'Error interno al reasignar boleto.' });
    }
};

const obtenerBoletos = (req, res) => {
    try {
        const transacciones = JSON.parse(fs.readFileSync(archivoTransacciones));
        return res.status(200).json({
            total: transacciones.length,
            boletos: transacciones
        });
    } catch (err) {
        console.error('Error al obtener boletos:', err);
        return res.status(500).json({ error: 'Error al leer los boletos.' });
    }
};

module.exports = {
    comprarBoleto,
    cancelarBoleto,
    reasignarBoleto,
    obtenerBoletos
};
