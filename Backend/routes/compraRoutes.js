const express = require('express');
const router = express.Router();
const { comprarBoleto, cancelarBoleto, reasignarBoleto, obtenerBoletos } = require('../controllers/compraController');

router.post('/comprar', comprarBoleto);
router.post('/cancelar', cancelarBoleto);
router.post('/reasignar', reasignarBoleto);
router.get('/', obtenerBoletos);


module.exports = router;
