const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Ruta a la carpeta frontend 
const frontendPath = path.join(__dirname, '../frontend');

// Servir archivos estáticos (HTML, CSS, JS)
app.use(express.static(frontendPath));

// Ruta principal para servir index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

