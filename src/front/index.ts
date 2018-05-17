
import debugM from "debug";
import http from "http";
import path from "path";

const debug = debugM(`frontend(${process.pid})`);

debug("Service starting...");
process.on("SIGTERM", gracefulShutdown.bind("SIGTERM"));
process.on("SIGINT", gracefulShutdown.bind("SIGKILL"));

function gracefulShutdown(signo: string) {
	debug(`Process received ${signo} signal. Attempting graceful shutdown...`);
	process.exit(0);
}

debug("service starting....");
process.chdir(path.dirname(process.argv[1]));

/** Simulate random fail within a 12h window */
setTimeout(() => {
	debug("Randomly failing.");
	process.exit(255);
}, Math.random() * 1000 * 60 * 60 * 12);
