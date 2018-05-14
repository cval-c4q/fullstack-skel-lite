
import http from "http";

import debugM from "debug";
const debug = debugM(`backend(${process.pid})`);

debug("service starting....");
process.on("SIGTERM", gracefulShutdown.bind("SIGTERM"));
process.on("SIGINT", gracefulShutdown.bind("SIGINT"));

function gracefulShutdown(signo: string) {
	debug(`Process received ${signo} signal. Attempting graceful shutdown...`);
	process.exit(0);
}

/** Simulate random fail within a 12h window */
setTimeout(() => {
	debug("Randomly failing!");
	process.exit(255);
}, Math.random()*1000*60*60*12);

