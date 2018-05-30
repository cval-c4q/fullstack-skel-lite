/**
 *  @file Entry point for the backend service
 */

import debugM from "debug";
import http from "http";
import net from "net";
import path from "path";

const debug = debugM(`backend(${process.pid})`);
const serv = http.createServer();

let servPort: number = 5001; // hardcoded default

/**
 *  Signal handler for SIGTERM and SIGINT, attempts a clean shutdown of the server
 *  @param {string} signo - Signal that is being currently handled
 */
function gracefulShutdown(signo: string) {
	debug(`Process received ${signo} signal. Attempting graceful shutdown...`);
	serv.close();
	process.exit(0);
}
process.on("SIGTERM", gracefulShutdown.bind("SIGTERM"));
process.on("SIGINT", gracefulShutdown.bind("SIGINT"));

debug("service starting....");
process.chdir(path.dirname(process.argv[1]));
debug("working directory: " + process.cwd());

// Handle any command line configuration options
const opts = process.argv.slice(2);
for (let idx = 0; idx < opts.length; idx++) {
	switch (true) {
		case opts[idx] == "--port":
		case opts[idx] == "-P":
			if (idx >= opts.length - 1) {
				process.stderr.write(`Option ${opts[idx]} expects an argument.\n`);
				process.exit(255);
			} else {
				servPort = Number.parseInt(opts[idx + 1]);
				idx++;
			}
			break;
		default:
			process.stdout.write(`
Usage: ${path.basename(process.argv[0])} [OPTIONS]
OPTIONS:
	--port, -P      Port to listen on\n`);
			if (opts[idx] === "--help" || opts[idx] === "-h") {
				process.exit(0);
			} else {
				debug(`Unrecognized command line option: ${opts[idx]}\n`);
			}
	}
}

serv.on("connection", (sock: net.Socket) => {
	debug(`Established new connection from ${sock.remoteAddress} on TCP port ${sock.remotePort}`);
	sock.on("close", () => {
		debug(`Connection ${sock.remoteAddress}:${sock.remotePort} closed.`);
	});
});

serv.on("request", (req: http.IncomingMessage, res: http.ServerResponse) => {
	let reqBody: string = "";
	req.on("data", (chunk: string | Buffer) => {
		reqBody += chunk.toString();
	});

	req.on("end", () => {
		const resBody: string = JSON.stringify({
			status: "OK",
			request: `${req.method} ${req.url}`,
			headers: req.headers,
			reqBody: `${reqBody}`,
		}) + "\n";

		res.writeHead(200, {
			"Content-Length": resBody.length,
			"Content-Type": "application/json",
		});

		res.end(resBody);
	});
});

serv.listen(servPort, () => {
	debug("Listening on TCP port", servPort);
});

/** Simulate random fail within a 12h window */
setTimeout(() => {
	debug("Randomly failing!");
	process.exit(255);
}, Math.random() * 1000 * 60 * 60 * 12);
