const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

module.exports = function(io) {
  const port = new SerialPort({ path: 'COM3', baudRate: 9600 });

  const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));


  parser.on('data', (data) => {
    const command = data.trim();
    console.log('Comando recibido de Arduino:', command);
     io.emit("mover", { button: data.trim() });
  });

  port.on('open', () => {
    console.log('Conexión serial abierta con Arduino');
  });

  port.on('error', (err) => {
    console.error('Error con el puerto serial:', err.message);
  });
};
