import { Smoll, SmollRoute, parseUrlEncodedBody } from "../lib/index.js";

const staticRoute: SmollRoute = {
	'/static': {
		GET: (req, res) => {
			const message = Buffer.from('Ruta statica en /static GET');

			res.writeHead(200, {
				'content-type': 'text/plain',
				'content-length': message.byteLength,
			});

			res.write(message);

			res.end();
		},
		POST: async (req, res) => {
			const body = await req.body();
			const parsed_body = JSON.stringify(parseUrlEncodedBody(body));

			res.writeHead(200, {
				'content-type': 'application/json',
			});
			res.write(parsed_body);
			res.end();
		},
	},
};

const dynamicRoute: SmollRoute = {
	'/dynamic/:id': {
		GET: (req, res) => {
			const message = Buffer.from('Ruta dinamica en /dynamic/:id GET');

			res.writeHead(200, {
				'content-type': 'text/plain',
				'content-length': message.byteLength,
			});

			res.write(message);

			res.end();
		},
		POST: (req, res) => {
			const message = Buffer.from('Ruta dinamica en /dynamic/:id POST');

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
		GET: (req, res) => {
			const message = Buffer.from('Ruta dinamica en /dynamic/:id/:pepe GET');

			res.writeHead(200, {
				'content-type': 'text/plain',
				'content-length': message.byteLength,
			});

			res.write(message);

			res.end();
		},
		POST: (req, res) => {
			const message = Buffer.from('Ruta dinamica en /dynamic/:id/:pepe POST');

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
	'/': {
		GET: (req, res) => {
			const message = Buffer.from('Route home');

			res.writeHead(200, {
				'content-type': 'text/plain',
				'content-length': message.byteLength,
			});

			res.write(message);

			res.end();
		},
	},
};

const c = new Smoll({
	host: 'localhost',
	port: 8080,
	routes: {
		...staticRoute,
		...dynamicRoute,
		...dynamicRouteMultiple,
		...homeRoute,
	},
});
