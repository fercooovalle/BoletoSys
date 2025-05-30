// arduino/serial.js
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');

module.exports = function(io) {
  // siempre en COM3 
  const port = new SerialPort({ path: 'COM3', baudRate: 9600 });

  const parser = port.pipe(new Readline({ delimiter: '\n' }));

  parser.on('data', (data) => {
    const command = data.trim(); // Ej: 'LEFT', 'RIGHT', 'ENTER', etc.
    console.log('Comando recibido de Arduino:', command);

    // Emitimos el comando al frontend usando socket.io
    io.emit('arduino-command', command);
  });

  port.on('open', () => {
    console.log('Conexión serial abierta con Arduino');
  });

  port.on('error', (err) => {
    console.error('Error con el puerto serial:', err.message);
  });
};
