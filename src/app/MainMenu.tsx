//
import React from "react";
import Media from "react-media";

import { ICanvasRenderWorkerArgs } from "./AppRoot";
import { ICanvasRenderWorkerProps } from "./AppRoot";

const LAYOUT_HORZ = Symbol("CCHorizentalLayout");
const LAYOUT_VERT = Symbol("CCVerticalLayout");

const _g: {
	lastTime: number | undefined,
	phase: number,
	resources: {
		puzzleLogo: HTMLImageElement,
	},
} = {
	lastTime: undefined,
	phase: 0.0,
	resources: {
		puzzleLogo: new Image(),
	},
};

export default class MainMenu extends React.Component<ICanvasRenderWorkerProps> {
	state: {
		layout: Symbol,
	};

	constructor(props: ICanvasRenderWorkerProps) {
		super(props);

		this.state = {
			layout: LAYOUT_HORZ,
		};

		this.renderWorker = this.renderWorker.bind(this);
		_g.resources.puzzleLogo.src = "/puzzle-logo.svg";
	}

	public render() {
		/** Based on media query, layouts only doing some visual configuration logic and setup, and return 'dummy' output to the React runtime, the real rendering is done internally */
		return (
		<Media query="(orientation: landscape)">
			{
				(matches: boolean) => matches ?
					   this.horizontalLayout()
					   : this.verticalLayout()
			}
		</Media>
		);
	}

	/**
	 *  Called from the render loop higher up the hierarchy
	 */
	public renderWorker(args: ICanvasRenderWorkerArgs) {
		if (args.ctx === null)
			return;

		args.ctx.save();
		if (_g.lastTime === undefined)
			_g.lastTime = args.timeStamp;

		args.ctx.clearRect(0, 0, args.canvas.width, args.canvas.height);
		args.ctx.beginPath();

		let x, y;

		if (this.state.layout === LAYOUT_VERT) {
			for (y = 0; y < args.canvas.height; y++) {
				if (y !== undefined && x !== undefined)
					args.ctx.lineTo(x, y);
				x = args.canvas.width / 2.0 + args.canvas.width / 3.0 * Math.sin(y * Math.PI * 3 / args.canvas.height + _g.phase);
				args.ctx.moveTo(x, y);
			}
		} else {
			for (x = 0; x < args.canvas.width; x++) {
				if (y !== undefined && x !== undefined)
					args.ctx.lineTo(x, y);
				y = args.canvas.height / 2.0 + args.canvas.height / 3.0 * Math.sin(x * Math.PI * 3 / args.canvas.width + _g.phase);
				args.ctx.moveTo(x, y);
			}
		}

		args.ctx.stroke();
		_g.phase += (args.timeStamp - _g.lastTime) / (1e3 * 2 / 3);

		const logo = _g.resources.puzzleLogo;
		args.ctx.drawImage(logo, (args.canvas.width - logo.width) / 2,
			(args.canvas.height - logo.height) / 2);

		_g.lastTime = args.timeStamp;
		args.ctx.restore();
	}

	public componentWillMount() {
		// Attach render worker
		this.props.attachRenderWorker(this.renderWorker);
	}

	/*componentWillUpdate() {
		console.log("[MainMenu] componentWillUpdate...");
	}*/
	public componentWillUnmount() {
		console.log("[MainMenu] componentWillUnmount...");
		this.props.detachRenderWorker(this.renderWorker);
	}
	public shouldComponentUpdate() {
		//console.log("[MainMenu] shouldComponentUpdate...");
		return false;
	}

	private horizontalLayout() {
		this.setState({layout: LAYOUT_HORZ });
		return "";
	}

	private verticalLayout() {
		this.setState({ layout: LAYOUT_VERT });
		return "";
	}

}
