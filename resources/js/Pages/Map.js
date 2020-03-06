import React from 'react'
import Layout from './Layout'

export default function Map({ map }) {

  return (
    <Layout title="Welcome">
		<h1>Welcome</h1>
		<MapDisplay
			image={map}
		/>
    </Layout>
  )
}

class MapDisplay extends React.Component {

	constructor(props) {
		super(props);

		// TODO: base on image size and client size
		this.minScale = 0.05;
		this.maxScale = 1.5;
		this.scrollStep = 0.2;

		this.state = {
			'image': props.image,
			'map': {
				'scale': 1,
				'offset': {'x': 0, 'y': 0},
				'dragging': false,
			},
		}
		this.updateDimensions = this.updateDimensions.bind(this);
		this.canvasMouseDown = this.canvasMouseDown.bind(this);
		this.canvasMouseUp = this.canvasMouseUp.bind(this);
		this.canvasMouseMove = this.canvasMouseMove.bind(this);
		this.canvasScroll = this.canvasScroll.bind(this);
	}

	updateDimensions() {
		const canvas = this.refs.canvas;
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
		this.draw(canvas);
	}

	draw(canvas) {
		const img = this.refs.image;
		const context = canvas.getContext("2d");
		context.clearRect(0, 0, canvas.width, canvas.height);
		const cheight = img.height * this.state.map.scale;
		const cwidth = cheight * (img.width / img.height);
		context.drawImage(img, this.state.map.offset.x, this.state.map.offset.y, cwidth, cheight);
	}
	canvasMouseDown(event) {
		let map = this.state.map;
		map.dragging = true;
		this.setState({map});
	}
	canvasMouseUp(event) {
		let map = this.state.map;
		map.dragging = false;
		this.setState({map});
	}
	canvasScroll(event) {
		const canvas = this.refs.canvas;
		let map = this.state.map;
		const mousePos = this.getMousePos(canvas, event);
		let xoff = (mousePos.x - map.offset.x) / map.scale;
		let yoff = (mousePos.y - map.offset.y) / map.scale;

		map.scale += (this.scrollStep * map.scale) * (event.deltaY > 0 ? -1 : 1);
		map.scale = Math.min(this.maxScale, Math.max(this.minScale, map.scale));

		map.offset.x = mousePos.x - (xoff * map.scale);
		map.offset.y = mousePos.y - (yoff * map.scale);

		this.setState({map});
		this.draw(canvas);
	}

	getMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
		  x: evt.clientX - rect.left,
		  y: evt.clientY - rect.top
		};
	}

	canvasMouseMove(event) {
		if (this.state.map.dragging) {
			const canvas = this.refs.canvas;
			let map = this.state.map;
			map.offset.x += event.movementX;
			map.offset.y += event.movementY;
			this.setState({map});
			this.draw(canvas);
		}
	}

	componentDidMount() {
		const img = this.refs.image;
		const canvas = this.refs.canvas;

		const context = canvas.getContext("2d");

		img.onload = () => {
			let map = this.state.map;
			map.scale = canvas.clientHeight / img.height;
			this.setState({map});
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;
			this.draw(canvas);
		}
		window.addEventListener('resize', this.updateDimensions);
	}
	
	componentWillUnmount() {
		window.removeEventListener('resize', this.updateDimensions);
	}

	render() {
		return (
			<div>
				<canvas 
					ref="canvas" 
					className="mapcanvas" 
					style={{ width: "100%", height: "100%" }}
					onMouseDown={this.canvasMouseDown}
					onMouseUp={this.canvasMouseUp}
					onMouseMove={this.canvasMouseMove}
					onWheel={this.canvasScroll}
				/>
				<img ref="image" src={this.state.image} className="hidden" />
			</div>
		);
	}
}