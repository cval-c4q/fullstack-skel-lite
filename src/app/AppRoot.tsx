
import * as React from "react";
import { Route, Switch } from "react-router";

// Local components and resouces
import MainMenu from "./MainMenu";
import "./styles.css";

/*
 *   Router-switched, Canvas-based component with following interface:
 *   constructor(props) with props: { canvas, ctx, attachRenderWorker: function, detachRenderWorker: function }
 *   For non-static rendering, component should
 *   * attach a render worker (function) with the ICanvasRenderWorkerArgs interface
 *   * should call detachRenderWorker() when not refraining from real-time rendering or when unmounting
 */
export interface ICanvasRenderWorkerProps {
	attachRenderWorker: Function;
	detachRenderWorker: Function;
}
export interface ICanvasRenderWorkerArgs {
	timeStamp: number;
	canvas: HTMLCanvasElement;
	ctx: CanvasRenderingContext2D;
}

export default class extends React.Component {
	private config: {
		showFPS: boolean,
	};

	private renderEngine: {
		canvas: HTMLCanvasElement | null,
		ctx: CanvasRenderingContext2D | null,
		renderDriver: (ts: number) => void,
		renderWorkers: Function[],
	};

	private FPSMeter: {
		samplingResolution: number,
		lastSamplingWhen: number | undefined,
		frameCountSince: number,
		curFPS: number | undefined,
	};

	constructor(props: {}) {
		super(props);

		this.config = {
			showFPS: true,
		};

		this.renderEngine = {
			canvas: null,
			ctx: null,
			renderDriver: this.renderDriver.bind(this),
			renderWorkers: [],
		};

		this.FPSMeter = {
			samplingResolution: 5000, // millisec
			lastSamplingWhen: undefined,
			frameCountSince: 0,
			curFPS: undefined,
		};
	}

	public attachRenderWorker(workerFunc: Function) {
		if (typeof workerFunc !== "function") {
			throw new Error("attachRenderWorker expects a function argument, got:" + typeof workerFunc);
		} else if (this.renderEngine.renderWorkers.indexOf(workerFunc) === -1) {
			this.renderEngine.renderWorkers.push(workerFunc);
		}
		console.log(this.renderEngine.renderWorkers.length, "active renderEnginee workers.");
	}

	public detachRenderWorker(workerFunc: Function) {
		if (typeof workerFunc !== "function") {
			throw new Error("detachRenderWorker expects a function argument, got:" + typeof workerFunc);
		} else if (this.renderEngine.renderWorkers.indexOf(workerFunc) !== -1) {
			this.renderEngine.renderWorkers.splice(this.renderEngine.renderWorkers.indexOf(workerFunc), 1);
		}
	}

	public componentDidMount() {
		//  Retrieve canvas/context
		this.renderEngine.canvas = this.refs.cvas as HTMLCanvasElement; // DOM reference
		this.renderEngine.ctx = this.renderEngine.canvas.getContext("2d");

		window.addEventListener("resize", (ev) => {
			/*
			 *  XXX: using float: left on canvas makes this unnecessary:
			 *  this._canvas.width = document.documentElement.clientWidth;
			 *  this._canvas.height = document.documentElement.clientHeight; */
			if (this.renderEngine.canvas) {
				this.renderEngine.canvas.width = window.innerWidth;
				this.renderEngine.canvas.height = window.innerHeight;
			}

			//  trigger re-render */
			this.setState({});
		});

		window.dispatchEvent(new Event("resize"));
		window.requestAnimationFrame(this.renderEngine.renderDriver);
	}

	/*
	componentWillUpdate() {
		// console.log("componentWillUpdate()");
	}
	componentWillUnmount() {
		// console.log("ComponentWillUnmount()");
	}
	shouldComponentUpdate() {
		//console.log("shouldComponentUpdate()");
		return true;
	}*/

	public render() {
		return (
			<React.Fragment>
				<canvas id="cvas" ref="cvas" width="10" height="10">
					<Switch>
						<Route exact path="/" render={() => <MainMenu
							attachRenderWorker={this.attachRenderWorker.bind(this)}
							detachRenderWorker={this.detachRenderWorker.bind(this)}/>
						}/>
					</Switch>
				</canvas>
			</React.Fragment>
			);
	}

	// Canvas-based internal render engine
	// Delegate rendering to attachable/detachable render workers
	private renderDriver(timeStamp: number): void {
		// Framerate measurement logic
		if (this.config.showFPS) {
			if (this.FPSMeter.lastSamplingWhen === undefined) {
				this.FPSMeter.lastSamplingWhen = timeStamp;
			} else if (timeStamp >= this.FPSMeter.lastSamplingWhen + this.FPSMeter.samplingResolution) {
				this.FPSMeter.curFPS = (this.FPSMeter.frameCountSince / (timeStamp - this.FPSMeter.lastSamplingWhen) * 1000) | 0;
				this.FPSMeter.lastSamplingWhen = timeStamp;
				this.FPSMeter.frameCountSince = 0;
			} else {
				this.FPSMeter.frameCountSince++;
			}
		}

		const renderArgs = {
			canvas: this.renderEngine.canvas,
			ctx: this.renderEngine.ctx,
			timeStamp,
		};

		this.renderEngine.renderWorkers.forEach((w) => typeof w === "function" && w(renderArgs));
		if (this.config.showFPS && this.renderEngine.ctx) {
			this.renderEngine.ctx.fillText("Framerate: " + (this.FPSMeter.curFPS ? this.FPSMeter.curFPS : "-") + " FPS", 10, 10);
		}

		requestAnimationFrame(this.renderEngine.renderDriver);
	}
}

// vi: ai ts=4 sw=4
