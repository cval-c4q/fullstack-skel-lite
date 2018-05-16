/**
 *   Top-level entry point. Spawns back and front-end components.
 *   Each component will be respawn witin its own process.
 */

import child_process from "child_process";
import clone from "clone";
import debugM from "debug";
import path from "path";

const debug = debugM(`toplevel(${process.pid})`);


/** Global state */
let _g: {
	optClient : boolean,
	optServer : boolean,
	clientEnv : Object,
	serverEnv : Object,
	clientLastStart : number,
	serverLastStart : number,
	failureTally : Map<string, Array<number>>,
	client?: child_process.ChildProcess,
	server?: child_process.ChildProcess,
	configDir: string,
} = {
	optClient : true,
	optServer : true,
	clientEnv : clone(process.env),
	serverEnv : clone(process.env),
	clientLastStart : -1,
	serverLastStart : -1,
	failureTally : new Map(),
	configDir : process.env["CONFIG_DIR"] || path.dirname(process.argv[1]),
};

if (process.argv.length > 2)
	process.argv.slice(2).forEach(arg => {
		switch (arg) {
			case "-C":
			case "--client-only":
				_g.optClient = true;
				_g.optServer = false;
				break;
			case "-S":
			case "--server-only":
				_g.optServer = true;
				_g.optClient = false;
				break;
			default:
				console.log(`
Usage: ${path.basename(process.argv[1])} [OPTION]...

OPTIONS:
  -C
  --client-only    Do not initialize backend service

  -S
  --server-only    Do not initialize frontend service
`);
				if (arg == "--help")
					process.exit(0);
		}
	});


/**
 *  Spurious failure detection in case subsystems are failing too quick
 */
const FAILURE_WINDOW =
	1000 *
	60; // keep track of spurious failure of subprocesses within a time window
	    // of this many milliseconds
const CRITICAL_FAIL_THRESHOLD =
	5; // if processes spuriously fail this many times within failure window,
	   // abort execution, giving platform/system a shot at a clean restart

function detectSpuriousFail(childHandle: string, timeStarted: number, timeEnded: number): boolean {
	let tally: Array<number> = _g.failureTally.get(childHandle) || [];

	// prune entries that are too old and update state
	tally.filter(tstamp => timeEnded-tstamp <= FAILURE_WINDOW);
	tally.push(timeEnded);
	_g.failureTally.set(childHandle, tally);

	if (tally.length >= CRITICAL_FAIL_THRESHOLD) {
		debug(`Failure tally for ${childHandle} reached critical threshold of ${CRITICAL_FAIL_THRESHOLD}!`.toUpperCase());
		return true;
	}

	return false;
}

function panicAbort() {
	debug("Abnormal abort: shutting down...");
	if (_g.client)
		_g.client.kill("SIGKILL");
	if (_g.server)
		_g.server.kill("SIGKILL");
	process.exit(255);
}

/*
 *  Client and server startup routines, self-restart on failure
 */
(function startClient() {
	if (_g.optClient) {
		debug("(Re)spawning frontend...");

		_g.clientLastStart = Date.now();
		_g.client = child_process.fork(path.resolve(process.argv[1], "../front/index.js"),
			undefined, {
				env : _g.clientEnv
			});

		_g.client.on('close', (ecode) => {
			debug("Frontend service exited with status code:", ecode);
			if (detectSpuriousFail("frontend", _g.clientLastStart, Date.now()))
				panicAbort();
			else
				process.nextTick(startClient);
		})
	}
})();

(function startServer() {
	if (_g.optServer) {
		debug("(Re)spawning backend...");

		_g.serverLastStart = Date.now();
		_g.server = child_process.fork(path.resolve(process.argv[1], "../back/index.js"),
			undefined, {
				env : _g.serverEnv,
			});

		_g.server.on('close', (ecode) => {
			debug("Backend service exited with status code:", ecode);
			if (detectSpuriousFail("backend", _g.serverLastStart, Date.now()))
				panicAbort();
			else
				process.nextTick(startServer);
		});
	}
})();
