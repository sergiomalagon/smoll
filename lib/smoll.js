import http from 'node:http';
import { Buffer } from 'node:buffer';

class Smoll {  
  constructor(opts) {
    this._routeRegex = new RegExp(/^(?<static>(?:\/\w*)+)$|^(?<dynamic>(?:(?:\/|\/:)\w+)+)$/);
    this._dynamicParamRegex = new RegExp(/:\w+/, 'g');
    this._dynamicRoutesRegex = '';
    this._staticRoutes = {};
    this._dynamicRoutes = {};
    this._dynamicRoutesArray = [];
    
    if (!opts?.routes) {
      throw new Error('No routes provided');
    }

    const routesKey = Object.keys(opts.routes);

    for (let i = 0, len = routesKey.length; i < len; ++i) {
      // We do a serch on every route to return if the route is full static
      // or contains dynamic segments.
      const route = this._routeRegex.exec(routesKey[i])?.groups;

      if (!route?.static && !route?.dynamic) {
        throw new Error('Error parsing the urls');
      }

      // We don't need to check for duplicates in static routes
      // because objects override themselves on duplicate key
      if (route.static) {
        this._staticRoutes[route.static] = opts.routes[route.static];
        continue;
      }

      if (route.dynamic) {
        // We replace the dynamic segments for [a-zA-Z0-9_]+
        // so we can check if the route is duplicated
        // and use it to build the regex
        const regexRoute = route.dynamic.replaceAll(this._dynamicParamRegex, '[a-zA-Z0-9_]+');

        if (this._dynamicRoutes[regexRoute]) {
          throw new Error(`Duplicated dynamic route: ${route.dynamic}`);
        } else {
          this._dynamicRoutes[regexRoute] = route.dynamic;

          if (this._dynamicRoutesRegex) {
            this._dynamicRoutesRegex += '|';
          }

          this._dynamicRoutesRegex += `^(${regexRoute})$`;

          this._dynamicRoutesArray.push({
            method: opts.routes[route.dynamic].method,
            handle: opts.routes[route.dynamic].handle,
          });
        }
      }
    }

    this._dynamicRoutesRegex = new RegExp(this._dynamicRoutesRegex);

    const server = http.createServer({ ...opts }, (req, res) => {
      // first we check in the static routes
      if (this._staticRoutes[req.url]) {
        this._staticRoutes[req.url].handle(req, res);
        return;
      }

      // if the url is not static then we search it as dynamic
      let match = this._dynamicRoutesRegex.exec(req.url);

      if (match) {
        match = match.slice(1);
        for (let i = 0, len = match.length; i < len; ++i) {
          if (match[i]) {
            this._dynamicRoutesArray[i].handle(req, res);
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