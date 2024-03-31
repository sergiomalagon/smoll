// early return if the http version is not compatible

import http from 'node:http';
import type { ServerOptions, IncomingMessage, ServerResponse } from 'node:http';

interface SmollRoutes {
  [path: string]: {
    method: 'GET';
    handle: (req: IncomingMessage, res: ServerResponse<IncomingMessage>) => void;
  };
}

interface SmollContructor extends ServerOptions {
  routes?: SmollRoutes;
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

export default class Smoll {
  routes: SmollRoutes = {};

  constructor(opts?: SmollContructor) {
    this.routes = opts?.routes || {};

    http.createServer({ ...opts }, this.callback().bind(this)).listen({
      host: opts?.host,
      port: opts?.port,
    });
  }

  private callback() {
    return function (this: Smoll, req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
      let handle;

      if (req?.url) {
        handle = this.routes[req.url];

        if (handle && handle.method === req.method) {
          handle.handle(req, res);
          return;
        }
      }
    };
  }
}

export { Smoll };

export type { SmollRoutes };
