const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { get } = require('../request');
const { SERVICIOS } = require('../config');

const MONITOREO = SERVICIOS.monitoreo;

const app = new express();

const puertosHealth = [
  {
    nombre: "paradas",
    data: SERVICIOS.paradas
  },
  {
    nombre: "cuando-viene",
    data: SERVICIOS.cuandoViene
  },
  {
    nombre: "lineas",
    data: SERVICIOS.lineas
  }
]

app.get('/', (req, res) => {
  res.sendFile('index.html', { root: __dirname });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

function mensaje(contenido) {
  const esTexto = typeof contenido === 'string';
  return JSON.stringify({ msg: contenido, type: esTexto ? 'texto' : 'estados' });
}

wss.on('connection', (ws) => {
  ws.send(mensaje('¡Conectado al monitoreo de servicios!'));

  setInterval(() => {

    let promesas = puertosHealth.map(servicio => {
      console.log(servicio);
      let promesa = new Promise((resolve, reject) => {
        get(servicio.data, "/health", (err, response) => {
          let status = err ? "DOWN" : "UP"
          resolve({ servicio: servicio.nombre, status: status })
        })
      });
      console.log(promesa)
      return promesa;
    });

    console.log(promesas);
    Promise.all(promesas).then(estados => {
      console.log(estados)
      ws.send(mensaje({estados: estados}));
    })

  }, 1000);

  ws.on('close', () => {
    console.log('Se cerró una conexión');
  });
});

server.listen(MONITOREO.puerto, () => {
  console.log(`[${MONITOREO.nombre}] escuchando en el puerto ${MONITOREO.puerto}`);
});

