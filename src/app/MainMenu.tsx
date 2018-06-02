//
import React from "react";
import Media from "react-media";

import { ICanvasRenderWorkerArgs } from "./AppRoot";
import { ICanvasRenderWorkerProps } from "./AppRoot";

const LAYOUT_HORZ = Symbol("CCHorizentalLayout");
const LAYOUT_VERT = Symbol("CCVerticalLayout");

let _g: {
	phase: number,
	lastTime: number | undefined,
	resources: {
		puzzleLogo: HTMLImageElement,
	},
} = {
	phase: 0.0,
	lastTime: undefined,
	resources: {
		puzzleLogo: new Image(),
	},
};

export default class MainMenu extends React.Component<ICanvasRenderWorkerProps> {
	state: {
		layout: Symbol,
	}

	constructor(props: ICanvasRenderWorkerProps) {
		super(props);
		
		this.state = {
			layout: LAYOUT_HORZ,
		};

		this.renderWorker = this.renderWorker.bind(this);
		_g.resources.puzzleLogo.src = "/puzzle-logo.svg";
	}

	render() {
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

	renderWorker(args: ICanvasRenderWorkerArgs) {
		args.ctx.save();
		if (_g.lastTime === undefined)
			_g.lastTime = args.timeStamp;

		args.ctx.clearRect(0, 0, args.canvas.width, args.canvas.height);
		args.ctx.beginPath();

		var x, y;

		if (this.state.layout === LAYOUT_VERT) {
			for (y=0; y<args.canvas.height; y++) {
				if (y !== undefined && x !== undefined)
					args.ctx.lineTo(x, y);
				x = args.canvas.width / 2.0 + args.canvas.width / 3.0 * Math.sin(y * Math.PI * 3 / args.canvas.height + _g.phase);
				args.ctx.moveTo(x, y);
			}
		} else {
			for (x=0; x<args.canvas.width; x++) {
				if (y !== undefined && x !== undefined)
					args.ctx.lineTo(x, y);
				y = args.canvas.height / 2.0 + args.canvas.height / 3.0 * Math.sin(x * Math.PI * 3 / args.canvas.width + _g.phase);
				args.ctx.moveTo(x, y);
			}
		}

		args.ctx.stroke();
		_g.phase += (args.timeStamp - _g.lastTime) / (1e3*2/3);

		let logo = _g.resources.puzzleLogo;
		args.ctx.drawImage(logo, (args.canvas.width - logo.width)/2,
			(args.canvas.height - logo.height)/2);

		_g.lastTime = args.timeStamp;
		args.ctx.restore();
	}

	horizontalLayout() {
		this.setState({layout: LAYOUT_HORZ });
		return "";
	}

	verticalLayout() {
		this.setState({ layout: LAYOUT_VERT });
		return "";
	}

	componentWillMount() {
		// Attach render worker
		this.props.attachRenderWorker(this.renderWorker);
	}

	/*componentWillUpdate() {
		console.log("[MainMenu] componentWillUpdate...");
	}*/
	componentWillUnmount() {
		console.log("[MainMenu] componentWillUnmount...");
		this.props.detachRenderWorker(this.renderWorker);
	}
	shouldComponentUpdate() {
		//console.log("[MainMenu] shouldComponentUpdate...");
		return false;
	}
}

