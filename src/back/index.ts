
import debugM from "debug";
import http from "http";
import net from "net";
import path from "path";

const debug = debugM(`backend(${process.pid})`);
const serv = http.createServer();

let servPort: number = 5001;

/* Set-up sig handlers */
function gracefulShutdown(signo: string) {
	debug(`Process received ${signo} signal. Attempting graceful shutdown...`);
	serv.close();
	process.exit(0);
}
process.on("SIGTERM", gracefulShutdown.bind("SIGTERM"));
process.on("SIGINT", gracefulShutdown.bind("SIGINT"));

debug("service starting....");
process.chdir(path.dirname(process.argv[1]));

process.argv.slice(2).forEach((opt: string, idx: number, arr: string[]) => {
	switch (opt) {
		case "--port":
		case "-P":
			if (idx >= arr.length - 1) {
				process.stderr.write(`Option ${opt} expects an argument.\n`);
				process.exit(255);
			} else {
				servPort = Number.parseInt(arr[idx + 1]);
			}
			break;
		default:
			process.stdout.write(`
Usage: ${path.basename(process.argv[0])} [OPTIONS]
OPTIONS:
	--port, -P      Port to listen on\n`);
			if (opt === "--help" || opt === "-h") {
				process.exit(0);
			} else {
				debug(`Unrecognized command line option: ${opt}\n`);
			}
	}
});

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
	debug("Listening on port:", servPort);
});

/** Simulate random fail within a 12h window */
setTimeout(() => {
	debug("Randomly failing!");
	process.exit(255);
}, Math.random() * 1000 * 60 * 60 * 12);
