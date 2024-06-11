import http from 'node:http';
import type { ServerOptions } from 'node:http';

export enum HTTP_METHODS {
	CONNECT = 'CONNECT',
	DELETE = 'DELETE',
	GET = 'GET',
	HEAD = 'HEAD',
	OPTIONS = 'OPTIONS',
	PATCH = 'PATCH',
	POST = 'POST',
	PUT = 'PUT',
	TRACE = 'TRACE',
}

export interface SmollRoute {
	[key: string]: {
		[key in HTTP_METHODS]?: (req: SmollRequest, res: SmollResponse) => void;
	};
}

export interface SmollConstructor extends ServerOptions {
	/**
	 * @todo Add docs
	 * @sergiomalagon
	 */
	routes: SmollRoute;
	/**
	 * @todo Add docs
	 * @default ```localhost```
	 */
	host?: string;
	/**
	 * @todo Add docs
	 * @default ```0```
	 */
	port?: number;
}

export class SmollRequest extends http.IncomingMessage {
	/**
	 * Return the body of the request.
	 */
	async body() {
		return new Promise<Buffer>((resolve, reject) => {
			const contentLength = Number(this.headers['content-length']);
			if (contentLength === 0) {
				reject('Request body is empty');
			}

			const data = Buffer.alloc(contentLength);
			let cursor = 0;
			this.on('data', (chunk) => {
				for (let i = 0; i < chunk.byteLength; i++) {
					cursor = data.writeUInt8(chunk[i], cursor);
				}
			});
			this.on('end', () => {
				resolve(data);
			});

			this.on('error', (error) => {
				reject(error);
			});
		});
	}
}

export class SmollResponse<Request extends http.IncomingMessage = http.IncomingMessage> extends http.ServerResponse<Request> {}

export class Smoll {
	private _port: number;
	private _host: string;
	private _routes: SmollRoute;
	private _routeRegex: RegExp;
	private _dynamicParamRegex: RegExp;
	private _dynamicRoutesRegex: string | RegExp;
	private _staticRoutes: SmollRoute;
	private _dynamicRoutesArray: SmollRoute[string][];

	constructor(opts: SmollConstructor) {
		this._port = opts?.port || 0;
		this._host = opts?.host || 'localhost';
		this._routes = opts?.routes || {};

		this._routeRegex = new RegExp(/^(?<static>(?:\/\w*)+)$|^(?<dynamic>(?:(?:\/|\/:)\w+)+)$/);
		this._dynamicParamRegex = new RegExp(/:\w+/, 'g');
		this._dynamicRoutesRegex = '';
		this._staticRoutes = {};
		this._dynamicRoutesArray = [];
		
		const routesKey = Object.keys(this._routes);
		for (let i = 0, len = routesKey.length; i < len; ++i) {
			const route = this._routeRegex.exec(routesKey[i])?.groups;

			if (!route?.static && !route?.dynamic) {
				throw new Error('Error parsing the urls');
			}

			if (route.static) {
				if (this._staticRoutes[route.static]) {
					throw new Error(`Error on route: ${route.static}, duplicated route.`);
				} else {
					this._staticRoutes[route.static] = this._routes[route.static];
					continue;
				}
			}

			if (route.dynamic) {
				const regexRoute = route.dynamic.replaceAll(this._dynamicParamRegex, '[a-zA-Z0-9_]+');

				if (this._dynamicRoutesRegex && i < len) {
					this._dynamicRoutesRegex += '|';
				}
				this._dynamicRoutesRegex += `^(${regexRoute})$`;
				this._dynamicRoutesArray.push(this._routes[route.dynamic]);
			}
		}

		this._dynamicRoutesRegex = new RegExp(this._dynamicRoutesRegex);

		const server = http.createServer({ ...opts, IncomingMessage: SmollRequest, ServerResponse: SmollResponse }, (req, res) => {
			if (!req?.url) {
				throw new Error('URL not found in request.');
			}

			if (!req?.method) {
				throw new Error('Method not found in request');
			}

			// First we check on the static routes as it requires less complex operations.
			if (this._staticRoutes[req.url]) {
				const methodHandle = this._staticRoutes[req.url][req.method as HTTP_METHODS];
				if (methodHandle) {
					methodHandle(req, res);
					return;
				} else {
					const message = Buffer.from('URL not found');
					res.writeHead(404, {
						'content-type': 'text/plain',
						'content-length': message.byteLength,
					});
					res.write(message);
					res.end();
				}
			}

			// If we fail to find the route as static we try to search it as dynamic.
			let match: RegExpExecArray | string[] = (this._dynamicRoutesRegex as RegExp).exec(req.url) as RegExpExecArray;
			if (match) {
				match = match.slice(1);
				for (let i = 0, len = match.length; i < len; ++i) {
					if (match[i]) {
						const methodHandle = this._dynamicRoutesArray[i][req.method as HTTP_METHODS];
						if (methodHandle) {
							methodHandle(req, res);
							return;
						}
					}
				}
			}

			const message = Buffer.from('URL not found');
			res.writeHead(404, {
				'content-type': 'text/plain',
				'content-length': message.byteLength,
			});
			res.write(message);
			res.end();
		});

		server.listen({ port: this._port, host: this._host }, () => {
			console.log(`Server started on http://${this._host}:${this._port}`);
		});
	}
}
export type { ServerOptions };
