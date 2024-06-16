import { SmollRequest } from './smoll.js';
import { Buffer, isUtf8 } from "node:buffer";

// TODO: Add docs!
export function parseUrlEncodedBody(body: Buffer) {
	const result: Record<"key"|"value", string | null>[] = [];
	const values = body.toString().split(/&/);
	for (let i = 0; i < values.length; i++) {
		const [key, value] = values[i].split(/=/);
		result.push({
			key: key ?? null,
			value: value ?? null,
		})
	}
	return result;
}

type MultiparseBodyResult = Record<"key"|"content-type"|"filename"|"value", string | null>[];

// TODO: Add docs!
export function parseMultipartBody(requestHeader: SmollRequest, body: Buffer) {
	if (!requestHeader.headers['content-type']) throw new Error('Content-Type header missing');
	
	let boundary: string | undefined;
	boundary = requestHeader.headers['content-type'].split(/;/).at(1)?.split(/=/).at(1);
	if (!boundary) throw Error('Error parsing header');
	
	const CONTENT_BOUNDARY	=	Buffer.from("--" + boundary);
	const END_BOUNDARY		=	Buffer.from("--" + boundary + "--");
	const IS_SAFE_TO_PARSE	=	isUtf8(body);
	const CONTENT_DISPOSITION_REGEX	=	new RegExp(/;\s(\w+)="(.+?)"/, "gm");
	
	const result: MultiparseBodyResult = [];	
	if (IS_SAFE_TO_PARSE) {
		const body_decoded = body.toString();
		const body_by_parts = body_decoded.split(CONTENT_BOUNDARY.toString());
		for (let i = 1; i < (body_by_parts.length - 1); i++) {
			const content_lines = body_by_parts[i].split(/\r\n/).filter(Boolean);
			let key: string | null = null;
			let value: string | null = null;
			let content_type = "text/plain";
			for (let j = 0; j < content_lines.length; j++) {
				if (content_lines[j].startsWith("Content-Disposition")) {
					key = CONTENT_DISPOSITION_REGEX.exec(content_lines[j])?.[2] ?? null;
					CONTENT_DISPOSITION_REGEX.lastIndex = 0;
				} else if (content_lines[j].startsWith("Content-Type")) {
					content_type = content_lines[j].split(/\s/)[1];
				} else {
					value = content_lines[j];
				}
			}
			result.push({
				key: key,
				value: value,
				["content-type"]: content_type,
				filename: null
			})
		}
		return result;
	} else {
		const CR						=	0x0D;
		const LF						=	0x0A;
		const DELIMITER					=	0x2D // "--" https://datatracker.ietf.org/doc/html/rfc7578#section-4.1;
		let i = 0;
		while (1) {
			if (i >= body.byteLength - (END_BOUNDARY.byteLength + 2)) break;
			const temp = Object.create(null);
			i += CONTENT_BOUNDARY.byteLength + 2;
			const content_disposition_temp = [];
			while (1) {
				if (body[i] === CR && body[i + 1] === LF) break;
				content_disposition_temp.push(body[i]);
				i++;
			}
			i += 2;
			while (1) {
				const content_disposition = CONTENT_DISPOSITION_REGEX.exec(Buffer.from(content_disposition_temp).toString());
				if (!content_disposition || content_disposition.length === 0) break;
				temp[content_disposition[1]] = content_disposition[2];
			}
			if (body[i] === CR && body[i + 1] === LF) {
				i += 2;
				const content_value = [];
				while (1) {
					if (body[i] === CR && body[i + 1] === LF && body[i + 2] === DELIMITER && body[i + 3] === DELIMITER) break;
					content_value.push(body[i]);
					i++;
				}
				i += 2;
				temp.value = Buffer.from(content_value).toString();
			} else {
				const content_type_header = [];
				while (1) {
					if (body[i] === CR && body[i + 1] === LF) break;
					content_type_header.push(body[i]);
					i++;
				}
				i += 4;
				const content_type_string = Buffer.from(content_type_header).toString();
				const content_type = content_type_string.split(/:/)?.[1]?.split(/\//)?.[0]?.trim();
				if (!content_type) throw new Error('Error while parsing Content-Type header field');
				temp['content-type'] = content_type;
				const content_value = [];
				while (1) {
					if (body[i] === CR && body[i + 1] === LF && body[i + 2] === DELIMITER && body[i + 3] === DELIMITER) break;
						content_value.push(body[i]);
						i++;
				}
				i += 2;
				temp.value = content_type === 'image' ? Buffer.from(content_value).toString('base64') : Buffer.from(content_value).toString();
			}
			result.push(temp);
		}
		return result;
	}
}

export async function encodeCookie(){ throw new Error("Function not implemented yet"); }
export async function decodeCookie(){ throw new Error("Function not implemented yet")}
