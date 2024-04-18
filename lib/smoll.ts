import http, { IncomingMessage, ServerOptions, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';

type SmollRoute = {
  [key: string]: {
    // Data from https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods
    method: 'CONNECT' | 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT' | 'TRACE';
    handle: (req: IncomingMessage, res: ServerResponse) => void;
  };
};

type SmollConstructor = {
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
} & ServerOptions;

class Smoll {
  private routeRegex = new RegExp(/^(?<static>(?:\/\w*)+)$|^(?<dynamic>(?:(?:\/|\/:)\w+)+)$/);
  private dynamicParamRegex = new RegExp(/:\w+/, 'g');
  private dynamicRoutesRegex = '';
  private staticRoutes: SmollRoute = {};
  private dynamicRoutes: { [key: string]: string} = {};
  private dynamicRoutesArray: { method:string; handle: (...args: any[]) => void }[] = [];

  constructor(opts: SmollConstructor) {
    if (!opts?.routes) {
      throw new Error('No routes provided');
    }

    const routesKey = Object.keys(opts.routes);

    for (let i = 0, len = routesKey.length; i < len; ++i) {
      // We do a serch on every route to return if the route is full static
      // or contains dynamic segments.
      const route = this.routeRegex.exec(routesKey[i])?.groups;

      if (!route?.static && !route?.dynamic) {
        throw new Error('Error parsing the urls');
      }

      // We don't need to check for duplicates in static routes
      // because objects override themselves on duplicate key
      if (route.static) {
        this.staticRoutes[route.static] = opts.routes[route.static];
        continue;
      }

      if (route.dynamic) {
        // We replace the dynamic segments for [a-zA-Z0-9_]+
        // so we can check if the route is duplicated
        // and use it to build the regex
        const regexRoute = route.dynamic.replaceAll(this.dynamicParamRegex, '[a-zA-Z0-9_]+');

        if (this.dynamicRoutes[regexRoute]) {
          throw new Error(`Duplicated dynamic route: ${route.dynamic}`);
        } else {
          this.dynamicRoutes[regexRoute] = route.dynamic;

          if (this.dynamicRoutesRegex) {
            this.dynamicRoutesRegex += '|';
          }

          this.dynamicRoutesRegex += `^(${regexRoute})$`;

          this.dynamicRoutesArray.push({
            method: opts.routes[route.dynamic].method,
            handle: opts.routes[route.dynamic].handle,
          });
        }
      }
    }

    const dynamicRoutesRegex = new RegExp(this.dynamicRoutesRegex);

    const server = http.createServer({ ...opts }, (req, res) => {
      // first we check in the static routes
      if (this.staticRoutes[req.url!]) {
        this.staticRoutes[req.url!].handle(req, res);
        return;
      }

      // if the url is not static then we search it as dynamic
      let match = dynamicRoutesRegex.exec(req.url!)?.slice(1);

      if (match) {
        for (let i = 0, len = match.length; i < len; ++i) {
          if (match[i]) {
            this.dynamicRoutesArray[i].handle(req, res);
            return;
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

    server.listen({ port: opts.port, host: opts.host }, () => {
      console.log(`Server started on http://${opts.host}:${opts.port}`);
    });
  }
}

export { Smoll };
export { Smoll as default };

export type { SmollRoute };
