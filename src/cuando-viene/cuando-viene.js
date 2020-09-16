const express = require('express');
const { colectivoMasCercano } = require('../ubicacion');
const { get } = require('../request');
const { healthCheck } = require('../middleware.js');
const { SERVICIOS } = require('../config');

const TRANSITO = SERVICIOS.cuandoViene;

const app = new express();

app.use(healthCheck);

app.get('/cuando-viene/:parada', (req, res) => {
  const parada = req.params.parada;

  get(SERVICIOS.paradas, "/paradas/" + parada, (err, info_parada) => {

    if (err) {
      console.log(err)
      return res.sendStatus(500);
    }

    const {lineas, ubicacion} = info_parada

    let listaPromises = lineas.map(linea => {

      return new Promise((resolve, reject) => {
        get(SERVICIOS.lineas, "/lineas/" + linea, (err, info_linea) => {
          if (err) return reject(err);

          let detalleLinea = {
            linea: linea,
            colectivos: info_linea.colectivos
          }
          resolve(colectivoMasCercano(detalleLinea, ubicacion));
        })
      });
    });

    console.log(listaPromises);

    let resultados = Promise.all(listaPromises).then(result => {
      console.log(res);
      res.json(result);
    }).catch((err) => {
      console.log(err);
      res.sendStatus(500);
    });

    console.log(resultados);

    // Queremos obtener, para cada linea de la parada, el próximo colectivo que va a llegar
  });

});

app.listen(TRANSITO.puerto, () => {
  console.log(`[${TRANSITO.nombre}] escuchando en el puerto ${TRANSITO.puerto}`);
});

