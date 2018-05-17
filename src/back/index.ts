
import debugM from "debug";
import http from "http";
import path from "path";

const debug = debugM(`backend(${process.pid})`);

/* Set-up sig handlers */
function gracefulShutdown(signo: string) {
	debug(`Process received ${signo} signal. Attempting graceful shutdown...`);
	process.exit(0);
}
process.on("SIGTERM", gracefulShutdown.bind("SIGTERM"));
process.on("SIGINT", gracefulShutdown.bind("SIGINT"));

debug("service starting....");
process.chdir(path.dirname(process.argv[1]));

/** Simulate random fail within a 12h window */
setTimeout(() => {
	debug("Randomly failing!");
	process.exit(255);
}, Math.random() * 1000 * 60 * 60 * 12);
