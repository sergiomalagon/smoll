import http from 'node:http';
import { Buffer } from 'node:buffer';

class Smoll {
  constructor(opts) {
    // Regex to check if the route is static or dynamic
    this._routeRegex = new RegExp(/^(?<static>(?:\/\w*)+)$|^(?<dynamic>(?:(?:\/|\/:)\w+)+)$/);

    this._replaceDynamicParamRegex = new RegExp(/:\w+/, 'g');
    this._replaceDynamicSymbol = new RegExp(/<>/, 'g');

    this._staticRoutes = {};
    this._dynamicRoutes = new Map();
    this._dynamicRoutesArray = [];

    this._dynamicRoutesMegaRegex;
    this._dynamicRoutesMegaRegexArray = [];

    if (!opts?.routes) {
      throw new Error('No routes provided');
    }

    const routesKey = Object.keys(opts.routes);

    let dynamicIndex = 0;
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
        // We replace the dynamic segments for "<>"
        // so we can check if the route is duplicated
        const cleanRoute = route.dynamic.replaceAll(this._replaceDynamicParamRegex, '<>');

        if (this._dynamicRoutes.has(cleanRoute)) {
          throw new Error(`Error on route ${route.dynamic}. Duplicated value.`);
        } else {
          // We use a map for fast? duplicate checking
          this._dynamicRoutes.set(cleanRoute, {});

          this._dynamicRoutesArray.push({
            originalRoute: route.dynamic,
            method: opts.routes[route.dynamic].method,
            handle: opts.routes[route.dynamic].handle,
          });

          // We build the regex to match this route
          const routeRegex = cleanRoute.replaceAll(this._replaceDynamicSymbol, '.+');
          this._dynamicRoutesMegaRegexArray.push(`^(${routeRegex})$`);
          dynamicIndex++;
        }
      }
    }

    this._dynamicRoutes.clear();
    this._dynamicRoutesMegaRegex = new RegExp(`${this._dynamicRoutesMegaRegexArray.join('|')}`);

    const server = http.createServer((req, res) => {

      // first we check in the static routes
      if (this._staticRoutes[req?.url ?? '/']) {
        this._staticRoutes[req?.url ?? '/'].handle(req, res);
        return;
      }

      // if the url is not static then we search it as dynamic
      let match = this._dynamicRoutesMegaRegex.exec(req?.url ?? '/');

      if (match) {
        const trimMatch = match.slice(1);
        for (let i = 0, len = trimMatch.length; i < len; ++i) {
          if (trimMatch[i]) {
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
