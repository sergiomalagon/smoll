import http from 'node:http'; // TODO: Upgrade to http2
import { Buffer } from 'node:buffer';

const PORT = 8000;
const HOST = 'localhost';

const server = http.createServer();

server.on('error', (err) => {
	console.log('err', err);
});

server.on('request', (req, res) => {
	req.on('error', (err) => {
		console.log(err);
		res.statusCode = 400;
		res.end();
	});

	res.on('error', (err) => {
		console.log(err);
	});

	const { headers } = req;

	if (!headers['content-length']) {
		throw new Error('content-length missing in request header');
	}

	let body = Buffer.alloc(Number(headers['content-length']));

	let allocUnsafeBuffer = Buffer.allocUnsafe(5000);

	req.on('data', (chunk: Uint8Array) => {
		let offsett = 0;

		for (let i = 0; i < body.length; i++) {
			const nextChunk = chunk[i];
			if (!nextChunk) continue;

			offsett = body.writeUInt8(nextChunk, offsett);
		}
	});

	req.on('end', () => {
		console.log('allocUnsafeBuffer', allocUnsafeBuffer.toString());

		console.log('request', req);
		res.writeHead(200, {
			'x-content-type-options': 'nosniff',
			'x-frame-options': 'DEN',
			'content-length': Buffer.byteLength(body),
			'content-type': 'multipart/form-data',
		});
		res.write(body.toString('utf-8'));
		res.end();
	});
});

server.listen(PORT, HOST, () => {
	console.log(`Server is running on http://${HOST}:${PORT}`);
});
