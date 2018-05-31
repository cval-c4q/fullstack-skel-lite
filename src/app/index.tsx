
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import { default as PuzzleMain } from "./AppRoot";

ReactDOM.render(<BrowserRouter><PuzzleMain /></BrowserRouter>,
	document.querySelector("body"));
