# Smoll

Node library for server creation with routing.

Don't bother sending PR's, I won't be reviewing them. I have this project public just to use the beneficts of public projects in GitHub. If you don't like something you can fork it.

Be aware, the API could break at any update.

## Changelog

### 0.1.0

- Added new class Smoll to handle the server logic
- Added suport for http 1.1 server
- Added suport for GET requests ( no error checking yet! 😔)

### 0.2.0

- Fixed semver version
- Added 404 routes fallback
- Updated package description

### 0.3.0

- Added router to handle static and dynamic routes
- Renamed library from "smoll-webserver" to "smoll"
- Moved project from TypeScript to JavaScript

### 0.3.1

- Fixed reference error with class variables

### 0.4.0

- Moved back the project to TypeScript
- Renamed and moved test files from tests folder to examples folder
- Added function to get the body of the request as Buffer.
- Changed how we declare the routes:
  
  Before

  ```typescript
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
  ```

  After

  ```typescript
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
  ```