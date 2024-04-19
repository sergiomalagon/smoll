import { IncomingMessage, ServerOptions, ServerResponse } from 'node:http';

type SmollRoute = {
    [key: string]: {
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

declare class Smoll {
    constructor(opts: SmollConstructor);
}

export { Smoll };
export { Smoll as default };
export type { SmollRoute };
