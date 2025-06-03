let contadorBoleto = 1;

class Boleto {
    constructor(nombreComprador, zona, asiento) {
        this.numero = contadorBoleto++;
        this.nombre = nombreComprador;
        this.zona = zona;
        this.asiento = asiento;
        this.fechaHora = new Date().toLocaleString();
        this.qrPath = ''; 
    }
}

class NodoZona {
    constructor(nombre, capacidad) {
        this.nombre = nombre;
        this.capacidad = capacidad;
        this.disponibles = capacidad;
        this.asientosOcupados = [];
        this.siguiente = null;
    }
}

class ListaZonas {
    constructor() {
        this.primero = null;
    }

    agregarZona(nombre, capacidad) {
        const nueva = new NodoZona(nombre, capacidad);
        if (!this.primero) {
            this.primero = nueva;
        } else {
            let actual = this.primero;
            while (actual.siguiente) actual = actual.siguiente;
            actual.siguiente = nueva;
        }
    }

    encontrarZona(nombre) {
        let actual = this.primero;
        while (actual) {
            if (actual.nombre === nombre) return actual;
            actual = actual.siguiente;
        }
        return null;
    }
}

class Cola {
    constructor() {
        this.items = [];
    }

    encolar(boleto, prioridad = false) {
        if (prioridad) {
            this.items.unshift(boleto); 
        } else {
            this.items.push(boleto); 
        }
    }

    desencolar() {
        return this.items.shift();
    }

    estaVacia() {
        return this.items.length === 0;
    }
}


class Pila {
    constructor() {
        this.items = [];
    }

    apilar(boleto) {
        this.items.push(boleto);
    }

    desapilar() {
        return this.items.pop();
    }

    estaVacia() {
        return this.items.length === 0;
    }
}

module.exports = { Boleto, NodoZona, ListaZonas, Cola, Pila };
