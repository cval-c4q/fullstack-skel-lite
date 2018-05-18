/**
 *   @file Top-level entry point. Spawns back and front-end components.
 *   Each component will be respawn witin its own process.
 */

import child_process from "child_process";
import clone from "clone";
import debugM from "debug";
import path from "path";

const debug = debugM(`toplevel(${process.pid})`);

/**
 * @global
 * Global state and runtime settings
 */
const _g: {
	optClient: boolean,
	optServer: boolean,
	clientEnv: object,
	serverEnv: object,
	clientLastStart: number,
	serverLastStart: number,
	failureTally: Map<string, number[]>,
	client?: child_process.ChildProcess,
	server?: child_process.ChildProcess,
	configDir: string,
} = {
	clientEnv: clone(process.env),
	clientLastStart: -1,
	configDir: process.env.CONFIG_DIR || path.dirname(process.argv[1]),
	failureTally: new Map(),
	optClient: true,
	optServer: true,
	serverEnv: clone(process.env),
	serverLastStart: -1,
};

if (process.argv.length > 2) {
	process.argv.slice(2).forEach((arg: string) => {
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
				process.stdout.write(`
Usage: ${path.basename(process.argv[1])} [OPTION]...

OPTIONS:
  -C
  --client-only    Do not initialize backend service

  -S
  --server-only    Do not initialize frontend service
`);
				if (arg === "--help") {
					process.exit(0);
				}
		}
	});
}

/**
 * @constant
 * @type {number}
 * keep track of spurious failure of subprocesses within a time window of this
 * many milliseconds
 */
const FAILURE_WINDOW = 1000 * 60;

/**
 * @constant
 * @type {number}
 * if processes spuriously fail this many times within failure window, abort
 * execution, giving platform/system a shot at a clean restart
 */
const CRITICAL_FAIL_THRESHOLD = 5;

/**
 *  For the given child process and failure incident, a return value of true
 *  indicates detection of spurious failure pattern.
 *  @param {string} childHandle - Unique identifier for service
 *  @param {number} timeStarted - UNIX time corresponding to when process was started
 *  @param {number} timeEnded - UNIX time corresponding to when process exited
 *  @return {bool} - Whether a pattern of spurious recurring failures is so far detected
 */
function detectSpuriousFail(childHandle: string, timeStarted: number, timeEnded: number): boolean {
	const tally: number[] = _g.failureTally.get(childHandle) || [];

	// prune entries that are too old and update state
	tally.filter((tstamp) => timeEnded - tstamp <= FAILURE_WINDOW);
	tally.push(timeEnded);
	_g.failureTally.set(childHandle, tally);

	if (tally.length >= CRITICAL_FAIL_THRESHOLD) {
		debug(`Failure tally for ${childHandle} reached critical threshold of ${CRITICAL_FAIL_THRESHOLD}!`.toUpperCase());
		return true;
	}

	return false;
}

/**
 *  Helper to kill any running child processes, print a diagnostic and terminate
 */
function panicAbort() {
	debug("Abnormal abort: shutting down...");
	if (_g.client) {
		_g.client.kill("SIGKILL");
	}
	if (_g.server) {
		_g.server.kill("SIGKILL");
	}
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
				env : _g.clientEnv,
			});

		_g.client.on("close", (ecode) => {
			debug("Frontend service exited with status code:", ecode);
			if (detectSpuriousFail("frontend", _g.clientLastStart, Date.now())) {
				panicAbort();
			} else {
				process.nextTick(startClient);
			}
		});
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

		_g.server.on("close", (ecode) => {
			debug("Backend service exited with status code:", ecode);
			if (detectSpuriousFail("backend", _g.serverLastStart, Date.now())) {
				panicAbort();
			} else {
				process.nextTick(startServer);
			}
		});
	}
})();
