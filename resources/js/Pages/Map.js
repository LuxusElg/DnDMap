import React, { useState } from 'react';
import classNames from 'classnames';
import { Inertia } from '@inertiajs/inertia'
import Icon from '@/Shared/Icon';

export default function Map({ map, locations }) {

	const [pins, setPins] = useState(locations.map(loc => {
		return { name: loc.name, position: {x: loc.pin_x, y: loc.pin_y}};
	}));

	const [placingPin, setPlacingPin] = useState(false);
	const [pinInput, setPinInput] = useState({
		show: false,
		position: { x: 0, y: 0 },
		pinPos: { x: 0, y: 0 }
	});
	const [redraw, setRedraw] = useState(false);
	let pinInputField = React.createRef();
	React.useEffect(() => {
		if (pinInput.show) {
			pinInputField.current.focus();
		}
	}, [pinInput]);

	function placePinBtnClick(event) {
		setPlacingPin(true);
		console.log('placing pin...');
	}
	function pinPlaced(mapPos, canvasPos) {
		setPlacingPin(false);
		setPinInput(values => ({
			...values,
			show: true,
			position: canvasPos,
			pinPos: mapPos
		}));
	}

	function pinInputKeyDown(event) {
		if (event.keyCode === 13) {
			const value = event.target.value;
			event.target.value = '';
			setPinInput(values => ({
				...values,
				show: false
			}));
			
			setPins(pins => [...pins, {
				name: value,
				position: pinInput.pinPos,
			}]);
			console.log('pin placed', {name:value,position:pinInput.pinPos});
			
            axios.post(route('locations.store'), {
				name: value,
				pin_x: pinInput.pinPos.x,
				pin_y: pinInput.pinPos.y,
			}).then(res => {
                    console.log(res);
                }).catch(err => {
                console.log(err);
            });
			setRedraw(true);
		}
	}

	function navigateBack(event) {
		Inertia.visit(route('home'));
	}

	return (
		<div>
			<div className="mt-1 ml-1 flex items-center justify-between bg-gray-800 rounded w-auto max-w-fit">
				<div className="flex items-center">
					<div className="p-2 text-white text-sm font-medium">
						<button
							onClick={navigateBack}
							className={`focus:outline-none items-center btn-red mr-1`}
						>
							Home
						</button>
						<button
							onClick={placePinBtnClick}
							className={`focus:outline-none items-center btn-red`}
						>
							Place pin
						</button>
					</div>
				</div>
			</div>
			<MapDisplay
				image={map}
				pins={pins}
				placingPin={placingPin}
				pinPlaced={pinPlaced}
				redraw={redraw}
				setRedraw={setRedraw}
			/>
			<div
				className={classNames('map-pin-edit mt-1 ml-1 flex items-center justify-between bg-gray-800 rounded w-auto max-w-fit', {
						'hidden': !pinInput.show
					})}
				style={{top: pinInput.position.y, left: pinInput.position.x}}
			>
				<div className="flex items-center">
					<div className="p-2 text-black text-sm font-medium">
						<input 
							ref={pinInputField}
							className={classNames('block w-64 h-6 fill-current')}
							onKeyDown={pinInputKeyDown}
						/>

					</div>
				</div>
			</div>
		</div>
	)
}

class MapDisplay extends React.Component {

	constructor(props) {
		super(props);

		// TODO: base on image size and client size
		this.minScale = 0.05;
		this.maxScale = 2.0;
		this.scrollStep = 0.2;

		this.state = {
			'image': props.image,
			'map': {
				'scale': 0.7,
				'offset': {'x': 0, 'y': 0},
				'dragging': false,
				'placing': false,
			},
			'map_interaction_disabled': false,
		}
		this.updateDimensions = this.updateDimensions.bind(this);
		this.canvasMouseDown = this.canvasMouseDown.bind(this);
		this.canvasMouseUp = this.canvasMouseUp.bind(this);
		this.canvasMouseMove = this.canvasMouseMove.bind(this);
		this.canvasScroll = this.canvasScroll.bind(this);
		this.canvasClick = this.canvasClick.bind(this);
		this.draw = this.draw.bind(this);
	}

	updateDimensions() {
		const canvas = this.refs.canvas;
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
		this.props.setRedraw(true);
	}

	draw() {
		if (this.props.redraw) {
			const canvas = this.refs.canvas;
			const img = this.refs.image;
			const context = canvas.getContext("2d");
			// clear the canvas
			context.clearRect(0, 0, canvas.width, canvas.height);
			// draw the base map
			this.drawMap(context, img);
			// draw icons
			this.drawIcons(context);
	
			this.props.setRedraw(false);
		}
	}

	drawMap(context, img) {
		const cheight = img.height * this.state.map.scale;
		const cwidth = cheight * (img.width / img.height);
		context.drawImage(img, this.state.map.offset.x, this.state.map.offset.y, cwidth, cheight);
	}

	drawIcons(ctx) {
		const map = this.state.map;
		for (const pin of this.props.pins) {
			let pos = this.fromMapCoords(pin.position, map);
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, 10 * map.scale, 0, 2 * Math.PI, false);
			ctx.fillStyle = '#F56565';
			ctx.lineWidth = 8 * map.scale;
			ctx.strokeStyle = '#1A202C';
			ctx.stroke();
			ctx.fill();

			ctx.lineWidth = 8;
			ctx.font = '30px Times New Roman';
			const textPos = {x: pos.x + 20 * map.scale, y: pos.y + 5 * map.scale}
			ctx.strokeText(pin.name, textPos.x, textPos.y);
			ctx.fillText(pin.name, textPos.x, textPos.y);
		}
	}

	/**
	 * Canvas mouse events
	 * button 0 = lmb
	 * button 1 = mmb
	 * button 2 = rmb
	 */
	canvasClick(event) {
		if (this.props.placingPin) {
			if (event.button === 0) {
				const canvas = this.refs.canvas;
				const map = this.state.map;
				let mapPos = this.getMapPos(canvas, map);
				this.props.pinPlaced(mapPos, this.getMousePos(canvas, event));
			}
		}
	}

	canvasMouseDown(event) {
		if (!this.state.map_interaction_disabled && event.button === 0) {
			let map = this.state.map;
			map.dragging = true;
			this.setState({map});
		}

	}
	canvasMouseUp(event) {
		if (!this.state.map_interaction_disabled && event.button === 0) {
			let map = this.state.map;
			map.dragging = false;
			this.setState({map});
		}
	}
	canvasScroll(event) {
		if (!this.state.map_interaction_disabled) {
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
			this.props.setRedraw(true);
		}
	}

	getMousePos(canvas, evt) {
		var rect = canvas.getBoundingClientRect();
		return {
		  x: evt.clientX - rect.left,
		  y: evt.clientY - rect.top
		};
	}
	getMapPos(canvas, map) {
		const mousePos = this.getMousePos(canvas, event);
		return this.toMapCoords(mousePos, map);
	}
	toMapCoords(pos, map) {
		return {
			x: Math.floor((pos.x - map.offset.x) / map.scale), 
			y: Math.floor((pos.y - map.offset.y) / map.scale)
		};
	}
	fromMapCoords(pos, map) {
		return {
			x: Math.round(pos.x * map.scale) + map.offset.x,
			y: Math.round(pos.y * map.scale) + map.offset.y
		};
	}
	centerMapOn(pos) {
		let map = this.state.map;
		const canvas = this.refs.canvas;
		const realPos = this.fromMapCoords(pos, map);
		const centerPos = {
			x: Math.round(canvas.width / 2),
			y: Math.round(canvas.height / 2)
		}
		map.offset.x = centerPos.x - realPos.x;
		map.offset.y = centerPos.y - realPos.y;
		this.setState({map});
	}

	canvasMouseMove(event) {
		if (this.state.map.dragging) {
			const canvas = this.refs.canvas;
			let map = this.state.map;
			map.offset.x += event.movementX;
			map.offset.y += event.movementY;
			this.setState({map});
			this.props.setRedraw(true);
		}
	}

	componentDidMount() {
		const img = this.refs.image;
		const canvas = this.refs.canvas;

		const context = canvas.getContext("2d");

		img.onload = () => {
			canvas.width = canvas.clientWidth;
			canvas.height = canvas.clientHeight;

			this.centerMapOn({x: 4752, y: 1463});

			setInterval(this.draw, 1000/60);
			this.props.setRedraw(true);
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
					onClick={this.canvasClick}
				/>
				<img ref="image" src={this.state.image} className="hidden" />
			</div>
		);
	}
}