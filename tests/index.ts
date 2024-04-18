import { Smoll, SmollRoute } from "../lib/smoll.js";

const staticRoute: SmollRoute = {
  '/static': {
    method: 'GET',
    handle: (req, res) => {
      const message = Buffer.from('Ruta statica en /static');

      res.writeHead(200, {
        'content-type': 'text/plain',
        'content-length': message.byteLength,
      });
      
      res.write(message);
      
      res.end();
    },
  },
};

const dynamicRoute: SmollRoute = {
  '/dynamic/:id': {
    method: 'GET',
    handle: (req, res) => {
      const message = Buffer.from('Ruta dinamica en /dynamic/:id');

      res.writeHead(200, {
        'content-type': 'text/plain',
        'content-length': message.byteLength,
      });

      res.write(message);

      res.end();
    },
  },
};

const dynamicRouteMultiple: SmollRoute = {
  '/dynamic/:id/:pepe': {
    method: 'GET',
    handle: (req, res) => {
      const message = Buffer.from('Ruta dinamica en /dynamic/:id/:pepe');

      res.writeHead(200, {
        'content-type': 'text/plain',
        'content-length': message.byteLength,
      });

      res.write(message);

      res.end();
    },
  },
};

const homeRoute: SmollRoute = {
  "/": {
    method: "GET",
    handle: (req, res) => {
      const message = Buffer.from('Route home');

      res.writeHead(200, {
        'content-type': 'text/plain',
        'content-length': message.byteLength,
      });

      res.write(message);

      res.end();
    }
  }
}

const _ = new Smoll({
  host: 'localhost',
  port: 8080,
  routes: {
    ...staticRoute,
    ...dynamicRoute,
    ...dynamicRouteMultiple,
    ...homeRoute
  },
});