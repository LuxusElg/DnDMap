import React, { useState } from 'react';
import classNames from 'classnames';
import { Inertia } from '@inertiajs/inertia'
import MapLocationModal from '@/Shared/MapLocationModal';

export default function Map({ map, locations, campaign }) {

	const [pins, setPins] = useState(locations.map(loc => {
		return { 
			name: loc.name, 
			position: {x: loc.pin_x, y: loc.pin_y},
			size: loc.size / 5,
			labelSize: (50 * Math.log(loc.size)/5),
		};
	}));
	const [mapLayers, setMapLayers] = useState({
		map: true,
		roads: true,
		towns: true,
	});
	const [toolSettings, setToolSettings] = useState({
		dragEnabled: true,
		zoomEnabled: true,
		rulerEnabled: false,
	});
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

	const [activeLocation, setActiveLocation] = useState(false);

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
				size: 50,
			}]);
			console.log('pin placed', {name:value,position:pinInput.pinPos});
			
            axios.post(route('locations.store'), {
				name: value,
				pin_x: pinInput.pinPos.x,
				pin_y: pinInput.pinPos.y,
				campaign_id: campaign.id,
				size: 50,
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

	function toggleMap(event) {
		setMapLayers(layers => ({
			...layers,
			map: !layers['map']
		}));
		setRedraw(true);
	}
	function toggleRoads(event) {
		setMapLayers(layers => ({
			...layers,
			roads: !layers['roads']
		}));
		setRedraw(true);
	}
	function toggleTowns(event) {
		setMapLayers(layers => ({
			...layers,
			towns: !layers['towns']
		}));
		setRedraw(true);
	}
	function toggleRuler(event) {
		setToolSettings(settings => ({
			...settings,
			dragEnabled: settings['rulerEnabled'],
			rulerEnabled: !settings['rulerEnabled'],
		}));
	}

	return (
		<div>
			<div className="absolute select-none mt-1 ml-1 flex items-center justify-between bg-gray-800 rounded w-auto max-w-fit">
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
			
			<div className="absolute select-none mt-20 ml-1 items-center justify-between bg-gray-800 rounded w-auto max-w-fit">
				<div className="p-2 flex flex-col text-white text-sm font-medium">
					<button
						onClick={toggleMap}
						className={`focus:outline-none items-center btn-red mb-1 p-1`}
					>
						Map
					</button>
					<button
						onClick={toggleRoads}
						className={`focus:outline-none items-center btn-red mb-1 p-1`}
					>
						Roads
					</button>
					<button
						onClick={toggleTowns}
						className={`focus:outline-none items-center btn-red mb-1 p-1`}
					>
						Towns
					</button>
					<button
						onClick={toggleRuler}
						className={`focus:outline-none items-center btn-red p-1`}
					>
						Ruler
					</button>
				</div>
			</div>

			<MapDisplay
				image={map}
				pins={pins}
				placingPin={placingPin}
				pinPlaced={pinPlaced}
				redraw={redraw}
				setRedraw={setRedraw}
				mapLayers={mapLayers}
				toolSettings={toolSettings}
				setToolSettings={setToolSettings}
				setActiveLocation={setActiveLocation}
			/>
			{activeLocation !== false && <MapLocationModal location={activeLocation} closeModal={() => { setActiveLocation(false); }}/>}
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
			},
		}
		this.pinHoverState = Array(this.props.pins.length).fill(false);

		this.ruler = {
			active: false,
			start: {x: 0, y: 0},
			end: {x: 0, y: 0},
			distance: 0,
			waypoints: [],
		}

		this.updateDimensions = this.updateDimensions.bind(this);
		this.canvasMouseDown = this.canvasMouseDown.bind(this);
		this.canvasMouseUp = this.canvasMouseUp.bind(this);
		this.canvasMouseMove = this.canvasMouseMove.bind(this);
		this.canvasScroll = this.canvasScroll.bind(this);
		this.canvasClick = this.canvasClick.bind(this);
		this.draw = this.draw.bind(this);
		this.handleContextMenu = this.handleContextMenu.bind(this);
	}

	handleContextMenu(event) {
		if (this.ruler.active) {
			const canvas = this.refs.canvas;
			const map = this.state.map;
			this.ruler.waypoints.push(new vec2(this.getMapPos(canvas, map, event)));
			
			event.preventDefault();
			return false;
		}
	}

	updateDimensions() {
		const canvas = this.refs.canvas;
		canvas.width = canvas.clientWidth;
		canvas.height = canvas.clientHeight;
		this.props.setRedraw(true);
	}

	draw() {
		if (true || this.props.redraw) {
			const canvas = this.refs.canvas;
			const img = this.refs.image;
			const layers = this.props.mapLayers;
			const map = this.state.map;
			const context = canvas.getContext("2d");

			// clear the canvas
			context.clearRect(0, 0, canvas.width, canvas.height);

			// Save context state and apply transformation matrix
			context.save();
			context.transform(map.scale, 0, 0, map.scale, map.offset.x, map.offset.y);

			// Draw map and all map artifacts
			if (layers.map) {
				this.drawMap(context, img);
			}
			if (layers.roads) {
				this.drawRoads(context);
			}
			if (layers.towns) {
				this.drawIcons(context);
			}

			// Draw tools
			this.drawTools(context);

			// Restore context state
			context.restore();
	
			this.props.setRedraw(false);
		}
	}
	
	drawMap(context, img) {
		context.drawImage(img, 0, 0, img.width, img.height);
	}


	drawIcons(ctx) {
		for (const [i, pin] of this.props.pins.entries()) {
			let pos = pin.position;
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, pin.size, 0, 2 * Math.PI, false);
			ctx.fillStyle = this.pinHoverState[i] ? '#F6AD55' : '#F56565';
			ctx.lineWidth = 8;
			ctx.strokeStyle = '#1A202C';
			ctx.stroke();
			ctx.fill();

			ctx.lineWidth = 8;
			ctx.font = pin.labelSize+'px Times New Roman';
			const textPos = {x: pos.x + 20, y: pos.y + 5}
			ctx.strokeText(pin.name, textPos.x, textPos.y);
			ctx.fillText(pin.name, textPos.x, textPos.y);
		}
	}

	drawTools(ctx) {
		if (this.props.toolSettings.rulerEnabled && this.ruler.active) {
			this.drawRuler(ctx);
		}
	}

	drawRuler(ctx) {
		const { start, end, distance, waypoints } = this.ruler;
		ctx.beginPath();
		ctx.moveTo(start.x, start.y);
		for (const wp of waypoints) {
			ctx.lineTo(wp.x, wp.y);
		}
		ctx.lineTo(end.x, end.y);
		ctx.lineWidth = 6 / this.state.map.scale;
		ctx.strokeStyle = 'yellow';
		ctx.stroke();
		
		ctx.font = (20 / this.state.map.scale)+'px Times New Roman';
		const textPos = {x: end.x + 20, y: end.y + 5}
		ctx.strokeText(distance + ' miles', textPos.x, textPos.y);
		ctx.fillText(distance + ' miles', textPos.x, textPos.y);
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
				let mapPos = this.getMapPos(canvas, map, event);
				this.props.pinPlaced(mapPos, this.getMousePos(canvas, event));
			}
		} else {
			for (const [i,e] of this.pinHoverState.entries()) {
				if (e) {
					this.props.setActiveLocation(this.props.pins[i]);
				}
			}
		}
	}

	canvasMouseDown(event) {
		const ts = this.props.toolSettings;
		const canvas = this.refs.canvas;
		let map = this.state.map;
		if (ts.dragEnabled && event.button === 0) {
			map.dragging = true;
			this.setState({map});
		} else if (ts.rulerEnabled && event.button === 0) {
			this.ruler.active = true;
			const currentPos = this.getMapPos(canvas, map, event);
			this.ruler.start = currentPos;
			this.ruler.waypoints = [];
			this.ruler.end = currentPos;
		}

	}
	canvasMouseUp(event) {
		const ts = this.props.toolSettings;
		if (ts.dragEnabled && event.button === 0) {
			let map = this.state.map;
			map.dragging = false;
			this.setState({map});
		} else if (ts.rulerEnabled && event.button === 0) {
			this.ruler.active = false;
		}
	}
	canvasScroll(event) {
		if (this.props.toolSettings.zoomEnabled) {
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
	getMapPos(canvas, map, event) {
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

	getPinBounds(pin) {
		return new boundingBox(
			{x: pin.position.x - pin.size, y: pin.position.y - pin.size},
			{x: pin.position.x + pin.size, y: pin.position.y + pin.size}
		);
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
		const canvas = this.refs.canvas;
		let map = this.state.map;
		if (this.state.map.dragging) {
			map.offset.x += event.movementX;
			map.offset.y += event.movementY;
			this.setState({map});
			this.props.setRedraw(true);
		} else if (this.ruler.active) {
			this.ruler.end = new vec2(this.getMapPos(canvas, map, event));

			let length = 0;
			let s = this.ruler.start;
			for (const wp of this.ruler.waypoints) {
				let d = wp.sub(s);
				length += d.length();
				s = wp;
			}
			let d = this.ruler.end.sub(s);
			length += d.length();
			// map scale is fucked, formula is 0.2742x+0.9192
			this.ruler.distance = Math.round(0.2742 * length + 0.9192);
			//this.ruler.distance = l.length();

			this.props.setRedraw(true);
		} else {
			for (const [i, pin] of this.props.pins.entries()) {
				const bounds = this.getPinBounds(pin);
				const mpos = new vec2(this.getMapPos(canvas, map, event));
				this.pinHoverState[i] = bounds.contains(mpos);
			}
		}
	}

	componentDidMount() {
		const img = this.refs.image;
		const canvas = this.refs.canvas;


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
					onContextMenu={this.handleContextMenu}
				/>
				<img ref="image" src={this.state.image} className="hidden" />
			</div>
		);
	}

	drawRoads(ctx) {
		
      // layer2/Path
      ctx.save();
      ctx.lineWidth = 3.0;
	  ctx.strokeStyle = '#F56565';
      ctx.beginPath();
      ctx.moveTo(3545.1, 530.7);
      ctx.bezierCurveTo(3535.9, 577.2, 3546.5, 562.6, 3551.5, 597.0);
      ctx.bezierCurveTo(3552.4, 640.3, 3570.3, 645.7, 3586.9, 669.6);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(3554.5, 755.7);
      ctx.bezierCurveTo(3551.6, 732.0, 3565.2, 724.3, 3575.0, 707.5);
      ctx.bezierCurveTo(3581.5, 691.6, 3578.7, 678.8, 3592.7, 662.2);
      ctx.bezierCurveTo(3596.7, 653.7, 3603.7, 630.7, 3612.8, 621.8);
      ctx.bezierCurveTo(3621.4, 616.8, 3626.9, 612.4, 3636.5, 601.9);
      ctx.bezierCurveTo(3640.9, 596.9, 3665.6, 588.5, 3666.1, 582.9);
      ctx.bezierCurveTo(3727.7, 503.8, 3698.3, 546.0, 3710.8, 494.8);
      ctx.bezierCurveTo(3712.9, 491.5, 3726.7, 479.5, 3726.6, 478.8);
      ctx.bezierCurveTo(3730.1, 457.5, 3743.5, 456.4, 3747.8, 453.9);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(3944.6, 896.7);
      ctx.bezierCurveTo(3939.9, 889.4, 3931.2, 879.7, 3930.6, 872.0);
      ctx.bezierCurveTo(3926.3, 819.6, 3874.3, 810.5, 3824.1, 784.7);
      ctx.bezierCurveTo(3809.0, 777.1, 3725.0, 723.1, 3696.5, 720.0);
      ctx.bezierCurveTo(3622.6, 670.7, 3626.8, 691.4, 3598.7, 647.0);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4061.5, 1354.5);
      ctx.bezierCurveTo(4062.2, 1325.7, 4061.6, 1320.5, 4050.3, 1301.0);
      ctx.bezierCurveTo(4030.5, 1267.2, 4033.1, 1257.0, 4029.3, 1229.9);
      ctx.bezierCurveTo(4028.9, 1221.0, 4007.9, 1160.9, 4003.9, 1146.8);
      ctx.bezierCurveTo(3999.2, 1135.8, 3999.1, 1093.3, 3995.2, 1077.8);
      ctx.bezierCurveTo(3984.8, 1038.6, 3957.6, 938.8, 3944.5, 901.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4225.5, 1776.5);
      ctx.bezierCurveTo(4206.1, 1728.6, 4209.0, 1723.7, 4203.6, 1662.5);
      ctx.bezierCurveTo(4196.7, 1569.5, 4198.5, 1585.9, 4165.6, 1499.2);
      ctx.bezierCurveTo(4119.1, 1354.2, 4081.8, 1417.2, 4061.5, 1360.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4360.5, 1937.5);
      ctx.bezierCurveTo(4361.1, 1919.6, 4373.3, 1874.4, 4360.4, 1858.9);
      ctx.bezierCurveTo(4329.3, 1823.1, 4259.1, 1798.4, 4225.5, 1780.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4614.5, 2441.5);
      ctx.bezierCurveTo(4605.9, 2434.8, 4594.8, 2428.0, 4587.7, 2421.2);
      ctx.bezierCurveTo(4574.9, 2398.1, 4539.4, 2393.1, 4521.2, 2379.7);
      ctx.bezierCurveTo(4495.5, 2345.4, 4496.8, 2356.7, 4481.2, 2342.3);
      ctx.bezierCurveTo(4469.9, 2326.6, 4462.9, 2315.7, 4441.5, 2305.4);
      ctx.bezierCurveTo(4416.4, 2288.2, 4403.5, 2244.3, 4399.4, 2211.9);
      ctx.bezierCurveTo(4390.6, 2188.7, 4388.7, 2178.4, 4383.2, 2143.8);
      ctx.bezierCurveTo(4351.8, 2045.0, 4294.4, 2125.2, 4359.5, 1942.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4625.5, 2441.5);
      ctx.bezierCurveTo(4724.7, 2466.6, 4788.8, 2590.9, 4807.4, 2596.0);
      ctx.bezierCurveTo(4914.8, 2654.1, 4893.0, 2668.5, 4944.8, 2723.0);
      ctx.bezierCurveTo(4966.0, 2745.2, 4966.4, 2749.2, 4978.4, 2769.8);
      ctx.bezierCurveTo(4987.1, 2781.4, 5008.8, 2792.9, 5012.5, 2801.2);
      ctx.bezierCurveTo(5021.1, 2815.3, 5085.8, 2902.6, 5081.5, 2911.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5084.5, 2917.5);
      ctx.bezierCurveTo(5129.5, 2951.0, 5192.6, 2956.6, 5238.3, 2991.4);
      ctx.bezierCurveTo(5289.3, 3027.5, 5311.2, 3064.2, 5324.1, 3136.8);
      ctx.bezierCurveTo(5330.9, 3167.3, 5360.2, 3226.2, 5397.1, 3229.6);
      ctx.bezierCurveTo(5427.6, 3237.9, 5460.4, 3222.4, 5492.5, 3226.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(3998.5, 855.5);
      ctx.bezierCurveTo(4021.4, 908.9, 4001.9, 937.6, 3964.2, 963.9);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(3944.5, 886.5);
      ctx.bezierCurveTo(4158.6, 756.7, 4133.2, 820.1, 4210.1, 782.4);
      ctx.bezierCurveTo(4297.8, 728.7, 4312.6, 746.4, 4357.3, 715.1);
      ctx.bezierCurveTo(4386.6, 694.8, 4415.7, 735.9, 4418.7, 679.6);
      ctx.bezierCurveTo(4420.4, 677.1, 4427.2, 673.4, 4430.5, 671.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4428.5, 660.5);
      ctx.bezierCurveTo(4418.0, 654.1, 4400.2, 645.3, 4386.4, 641.7);
      ctx.bezierCurveTo(4360.4, 626.6, 4416.9, 577.2, 4358.4, 585.7);
      ctx.bezierCurveTo(4351.0, 588.6, 4342.5, 579.9, 4336.5, 574.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4347.5, 610.5);
      ctx.bezierCurveTo(4345.4, 601.1, 4345.2, 592.2, 4354.3, 586.2);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4444.5, 671.5);
      ctx.bezierCurveTo(4506.0, 694.6, 4474.3, 701.0, 4499.5, 710.1);
      ctx.bezierCurveTo(4536.1, 716.1, 4554.7, 743.1, 4528.8, 775.6);
      ctx.bezierCurveTo(4510.2, 808.2, 4498.7, 836.1, 4510.5, 869.8);
      ctx.bezierCurveTo(4518.8, 940.2, 4568.6, 939.8, 4594.1, 968.4);
      ctx.bezierCurveTo(4613.3, 987.7, 4614.9, 1121.4, 4617.5, 1153.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4617.5, 1165.5);
      ctx.bezierCurveTo(4626.1, 1234.6, 4646.6, 1227.9, 4686.9, 1271.1);
      ctx.bezierCurveTo(4721.4, 1300.1, 4716.3, 1317.7, 4734.5, 1378.5);
      ctx.bezierCurveTo(4741.0, 1402.5, 4754.8, 1431.8, 4749.5, 1461.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4745.5, 1466.5);
      ctx.bezierCurveTo(4602.8, 1444.4, 4596.6, 1394.4, 4488.0, 1443.8);
      ctx.bezierCurveTo(4436.2, 1451.8, 4463.3, 1487.8, 4431.2, 1500.1);
      ctx.bezierCurveTo(4362.2, 1524.8, 4372.0, 1521.1, 4355.7, 1552.6);
      ctx.bezierCurveTo(4321.5, 1610.0, 4254.2, 1602.6, 4202.5, 1616.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4339.5, 1684.5);
      ctx.bezierCurveTo(4323.2, 1657.0, 4319.6, 1622.8, 4304.1, 1595.0);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4753.5, 1469.5);
      ctx.bezierCurveTo(4767.8, 1512.9, 4762.3, 1521.1, 4760.7, 1565.4);
      ctx.bezierCurveTo(4761.3, 1622.9, 4751.9, 1647.8, 4745.5, 1677.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4745.5, 1689.5);
      ctx.bezierCurveTo(4740.4, 1724.5, 4737.8, 1765.8, 4736.2, 1801.4);
      ctx.bezierCurveTo(4727.1, 1844.3, 4708.7, 1894.0, 4702.5, 1937.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4694.5, 1937.5);
      ctx.bezierCurveTo(4621.4, 1935.1, 4626.9, 1974.8, 4603.5, 1982.6);
      ctx.bezierCurveTo(4562.7, 1994.2, 4556.7, 2002.5, 4540.5, 2016.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4701.5, 1945.5);
      ctx.bezierCurveTo(4696.8, 1988.9, 4686.1, 2055.6, 4670.8, 2092.9);
      ctx.bezierCurveTo(4658.5, 2146.8, 4641.3, 2197.0, 4626.5, 2228.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4622.5, 2238.5);
      ctx.bezierCurveTo(4619.5, 2262.0, 4599.7, 2275.7, 4594.5, 2297.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4588.5, 2309.5);
      ctx.bezierCurveTo(4579.3, 2318.5, 4582.4, 2331.7, 4578.9, 2344.0);
      ctx.bezierCurveTo(4571.0, 2361.2, 4568.4, 2384.5, 4567.8, 2402.6);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4619.5, 2434.5);
      ctx.bezierCurveTo(4683.0, 2372.9, 4684.7, 2409.2, 4711.7, 2347.3);
      ctx.bezierCurveTo(4718.1, 2341.6, 4726.1, 2330.7, 4725.8, 2324.8);
      ctx.bezierCurveTo(4728.9, 2291.4, 4739.4, 2276.3, 4767.2, 2271.5);
      ctx.bezierCurveTo(4768.7, 2271.0, 4790.5, 2249.2, 4791.5, 2248.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4748.5, 2475.5);
      ctx.lineTo(4744.2, 2491.3);
      ctx.bezierCurveTo(4743.1, 2495.4, 4741.3, 2499.3, 4738.9, 2502.8);
      ctx.lineTo(4733.1, 2511.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4757.5, 1465.5);
      ctx.bezierCurveTo(4767.8, 1466.8, 4793.6, 1466.3, 4801.9, 1470.2);
      ctx.bezierCurveTo(4832.3, 1494.6, 4870.5, 1496.1, 4903.0, 1481.3);
      ctx.bezierCurveTo(4910.8, 1475.8, 4945.4, 1482.6, 4956.5, 1483.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4964.5, 1481.5);
      ctx.bezierCurveTo(4956.6, 1461.2, 4932.9, 1456.5, 4934.5, 1438.5);
      ctx.bezierCurveTo(4940.8, 1418.6, 4926.6, 1403.1, 4928.5, 1384.5);
      ctx.bezierCurveTo(4937.1, 1336.8, 4923.0, 1343.5, 4928.8, 1334.9);
      ctx.bezierCurveTo(4941.6, 1324.5, 4966.9, 1317.7, 4971.4, 1299.8);
      ctx.bezierCurveTo(4974.4, 1268.3, 4929.9, 1304.8, 4946.5, 1248.7);
      ctx.bezierCurveTo(4946.8, 1242.9, 4942.4, 1236.5, 4940.9, 1230.6);
      ctx.bezierCurveTo(4938.9, 1224.9, 4950.6, 1212.8, 4952.5, 1208.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4959.5, 1201.5);
      ctx.bezierCurveTo(4961.4, 1181.6, 4986.7, 1178.1, 5001.2, 1168.8);
      ctx.bezierCurveTo(5010.0, 1162.8, 5017.9, 1146.4, 5030.3, 1149.4);
      ctx.bezierCurveTo(5084.5, 1168.8, 5061.4, 1145.8, 5104.1, 1119.7);
      ctx.bezierCurveTo(5117.9, 1093.2, 5113.0, 1090.7, 5112.2, 1069.9);
      ctx.bezierCurveTo(5114.4, 1054.8, 5123.1, 1053.9, 5115.5, 1039.3);
      ctx.bezierCurveTo(5114.9, 1027.7, 5127.7, 1031.9, 5132.6, 1021.9);
      ctx.bezierCurveTo(5137.9, 1011.4, 5153.4, 1017.4, 5158.4, 1006.4);
      ctx.bezierCurveTo(5160.7, 998.8, 5160.2, 991.4, 5169.5, 988.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5261.5, 906.5);
      ctx.bezierCurveTo(5287.9, 915.7, 5294.5, 909.9, 5313.8, 911.4);
      ctx.bezierCurveTo(5348.1, 921.6, 5353.1, 918.1, 5377.1, 931.9);
      ctx.bezierCurveTo(5401.7, 931.8, 5429.7, 929.8, 5453.5, 936.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5463.5, 942.5);
      ctx.bezierCurveTo(5527.8, 962.4, 5460.3, 997.1, 5581.9, 1003.6);
      ctx.bezierCurveTo(5620.6, 1016.8, 5633.0, 1007.6, 5655.5, 1016.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5665.5, 1032.5);
      ctx.lineTo(5665.5, 1048.3);
      ctx.bezierCurveTo(5665.5, 1053.7, 5664.5, 1059.1, 5662.7, 1064.2);
      ctx.lineTo(5658.3, 1075.9);
      ctx.bezierCurveTo(5656.4, 1080.9, 5655.5, 1086.2, 5655.5, 1091.6);
      ctx.lineTo(5655.5, 1116.5);
      ctx.bezierCurveTo(5655.5, 1119.8, 5656.0, 1123.1, 5657.1, 1126.3);
      ctx.lineTo(5657.6, 1127.8);
      ctx.bezierCurveTo(5659.5, 1133.4, 5663.4, 1138.1, 5668.5, 1141.0);
      ctx.lineTo(5678.5, 1146.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5668.5, 1012.5);
      ctx.bezierCurveTo(5678.0, 966.5, 5701.0, 977.7, 5762.8, 950.1);
      ctx.bezierCurveTo(5832.0, 919.9, 5989.9, 889.1, 6034.0, 916.3);
      ctx.bezierCurveTo(6089.4, 934.1, 6078.0, 940.9, 6081.5, 979.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5830.5, 942.5);
      ctx.lineTo(5815.4, 931.8);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6073.4, 934.8);
      ctx.bezierCurveTo(6102.7, 911.1, 6120.5, 936.4, 6145.9, 934.4);
      ctx.bezierCurveTo(6170.5, 932.7, 6174.0, 943.7, 6191.4, 951.1);
      ctx.bezierCurveTo(6243.4, 966.9, 6245.4, 974.6, 6279.8, 988.9);
      ctx.bezierCurveTo(6308.8, 995.6, 6314.1, 982.4, 6333.4, 971.6);
      ctx.bezierCurveTo(6378.5, 960.7, 6389.5, 975.6, 6409.0, 986.2);
      ctx.bezierCurveTo(6433.7, 994.7, 6440.3, 966.7, 6469.5, 963.0);
      ctx.bezierCurveTo(6487.3, 955.2, 6517.2, 957.3, 6538.1, 951.1);
      ctx.bezierCurveTo(6577.2, 934.5, 6615.3, 912.2, 6627.5, 875.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6037.5, 788.5);
      ctx.bezierCurveTo(6049.6, 793.7, 6058.1, 795.9, 6056.4, 809.6);
      ctx.bezierCurveTo(6051.2, 828.1, 6033.6, 825.4, 6050.9, 844.1);
      ctx.bezierCurveTo(6060.1, 856.2, 6077.9, 853.0, 6090.1, 858.0);
      ctx.bezierCurveTo(6116.6, 875.1, 6106.9, 904.9, 6105.6, 925.2);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6127.4, 931.8);
      ctx.lineTo(6135.8, 919.9);
      ctx.bezierCurveTo(6139.5, 915.1, 6144.6, 911.4, 6150.4, 909.5);
      ctx.lineTo(6176.5, 901.5);
      ctx.lineTo(6191.3, 895.9);
      ctx.bezierCurveTo(6198.1, 893.6, 6205.1, 892.1, 6212.2, 891.4);
      ctx.lineTo(6235.6, 891.2);
      ctx.bezierCurveTo(6246.4, 890.1, 6256.2, 884.5, 6262.5, 875.8);
      ctx.lineTo(6271.2, 860.9);
      ctx.bezierCurveTo(6274.0, 856.0, 6277.9, 851.8, 6282.6, 848.6);
      ctx.lineTo(6298.6, 839.8);
      ctx.bezierCurveTo(6307.5, 833.6, 6318.1, 822.9, 6324.5, 812.8);
      ctx.bezierCurveTo(6326.2, 810.2, 6328.0, 807.8, 6330.1, 805.6);
      ctx.lineTo(6339.1, 795.6);
      ctx.bezierCurveTo(6344.0, 790.2, 6349.3, 783.3, 6355.5, 779.5);
      ctx.lineTo(6368.8, 770.4);
      ctx.bezierCurveTo(6378.3, 764.7, 6389.5, 762.8, 6400.3, 765.0);
      ctx.lineTo(6422.5, 772.5);
      ctx.lineTo(6462.4, 780.6);
      ctx.bezierCurveTo(6471.7, 782.5, 6480.7, 786.0, 6488.9, 790.8);
      ctx.lineTo(6505.5, 800.5);
      ctx.lineTo(6534.5, 816.0);
      ctx.bezierCurveTo(6542.5, 820.3, 6550.0, 825.4, 6557.0, 831.2);
      ctx.lineTo(6576.4, 849.3);
      ctx.bezierCurveTo(6583.8, 855.4, 6591.9, 860.6, 6600.5, 864.8);
      ctx.lineTo(6616.0, 870.9);
      ctx.bezierCurveTo(6620.3, 872.6, 6624.8, 873.8, 6629.4, 874.4);
      ctx.lineTo(6647.3, 875.9);
      ctx.bezierCurveTo(6659.4, 877.0, 6671.6, 876.7, 6683.6, 875.0);
      ctx.lineTo(6703.2, 871.6);
      ctx.bezierCurveTo(6708.7, 870.9, 6714.3, 870.6, 6719.9, 870.9);
      ctx.lineTo(6735.6, 872.2);
      ctx.bezierCurveTo(6744.8, 873.1, 6754.0, 874.8, 6763.0, 877.3);
      ctx.lineTo(6794.5, 886.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6214.5, 910.5);
      ctx.lineTo(6206.1, 892.2);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6388.5, 821.5);
      ctx.lineTo(6373.2, 811.1);
      ctx.bezierCurveTo(6366.8, 806.7, 6360.8, 801.6, 6355.4, 795.9);
      ctx.lineTo(6346.9, 786.9);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6582.5, 682.5);
      ctx.bezierCurveTo(6600.5, 700.4, 6579.2, 706.0, 6585.2, 721.0);
      ctx.bezierCurveTo(6591.7, 736.7, 6576.0, 731.6, 6571.6, 740.1);
      ctx.bezierCurveTo(6568.0, 747.0, 6570.4, 756.0, 6568.0, 763.4);
      ctx.bezierCurveTo(6567.3, 768.9, 6539.6, 812.3, 6537.0, 817.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5999.5, 1082.5);
      ctx.bezierCurveTo(5976.4, 1108.9, 5940.4, 1113.5, 5907.1, 1108.4);
      ctx.bezierCurveTo(5893.0, 1110.1, 5878.7, 1117.3, 5865.2, 1120.9);
      ctx.bezierCurveTo(5830.2, 1157.3, 5837.9, 1148.0, 5797.0, 1136.2);
      ctx.bezierCurveTo(5778.7, 1133.0, 5772.4, 1144.9, 5756.7, 1146.0);
      ctx.bezierCurveTo(5734.5, 1145.2, 5711.2, 1155.9, 5688.5, 1147.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5683.5, 1150.5);
      ctx.bezierCurveTo(5679.9, 1170.1, 5672.2, 1187.7, 5662.6, 1205.0);
      ctx.bezierCurveTo(5657.6, 1241.9, 5645.7, 1264.0, 5623.1, 1270.0);
      ctx.bezierCurveTo(5569.2, 1289.0, 5546.2, 1301.2, 5501.4, 1315.0);
      ctx.bezierCurveTo(5484.6, 1323.5, 5467.4, 1338.0, 5449.0, 1342.8);
      ctx.bezierCurveTo(5387.2, 1354.3, 5346.3, 1377.1, 5303.5, 1381.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5598.5, 1253.5);
      ctx.lineTo(5605.9, 1276.2);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5357.5, 1456.5);
      ctx.lineTo(5355.2, 1451.4);
      ctx.bezierCurveTo(5353.4, 1447.5, 5352.5, 1443.3, 5352.5, 1439.1);
      ctx.lineTo(5352.5, 1437.0);
      ctx.bezierCurveTo(5352.5, 1432.0, 5353.2, 1427.1, 5354.5, 1422.3);
      ctx.lineTo(5358.4, 1408.2);
      ctx.bezierCurveTo(5359.8, 1401.8, 5359.9, 1395.2, 5358.9, 1388.7);
      ctx.lineTo(5354.9, 1369.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5294.5, 1385.5);
      ctx.bezierCurveTo(5237.8, 1383.2, 5164.0, 1398.2, 5116.1, 1409.7);
      ctx.bezierCurveTo(5070.4, 1421.9, 5063.6, 1422.6, 5033.9, 1451.6);
      ctx.bezierCurveTo(5017.9, 1465.5, 4981.4, 1467.9, 4961.5, 1484.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4961.5, 1816.5);
      ctx.bezierCurveTo(5072.0, 1707.9, 5105.4, 1720.4, 5100.2, 1669.1);
      ctx.bezierCurveTo(5100.0, 1661.5, 5104.1, 1654.6, 5112.4, 1646.7);
      ctx.bezierCurveTo(5136.0, 1620.5, 5177.2, 1599.7, 5192.1, 1579.1);
      ctx.bezierCurveTo(5293.2, 1467.2, 5252.4, 1471.2, 5297.5, 1387.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4748.5, 1684.5);
      ctx.lineTo(4766.4, 1693.4);
      ctx.bezierCurveTo(4770.4, 1695.5, 4774.2, 1698.1, 4777.5, 1701.2);
      ctx.lineTo(4787.8, 1711.0);
      ctx.bezierCurveTo(4790.3, 1713.3, 4792.8, 1715.5, 4795.5, 1717.6);
      ctx.lineTo(4824.3, 1739.7);
      ctx.bezierCurveTo(4828.4, 1742.9, 4832.0, 1746.6, 4835.0, 1750.9);
      ctx.lineTo(4836.5, 1753.0);
      ctx.bezierCurveTo(4839.2, 1756.6, 4842.5, 1759.6, 4846.4, 1761.9);
      ctx.lineTo(4867.6, 1773.9);
      ctx.bezierCurveTo(4869.5, 1775.0, 4871.4, 1776.2, 4873.1, 1777.5);
      ctx.lineTo(4882.4, 1784.8);
      ctx.bezierCurveTo(4886.4, 1787.9, 4891.1, 1790.1, 4896.0, 1791.2);
      ctx.lineTo(4914.5, 1795.5);
      ctx.lineTo(4926.7, 1803.6);
      ctx.bezierCurveTo(4930.5, 1806.2, 4934.7, 1808.4, 4939.0, 1810.1);
      ctx.lineTo(4957.5, 1817.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4959.5, 1821.5);
      ctx.bezierCurveTo(4956.6, 1861.5, 4950.2, 1913.5, 4954.0, 1949.1);
      ctx.bezierCurveTo(4971.7, 2107.9, 4920.9, 2042.5, 4889.5, 2128.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4705.5, 1939.5);
      ctx.bezierCurveTo(4757.3, 1970.3, 4743.3, 1979.2, 4761.4, 2011.6);
      ctx.bezierCurveTo(4801.6, 2076.3, 4748.3, 2084.9, 4818.5, 2123.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(4825.5, 2124.5);
      ctx.bezierCurveTo(5028.6, 2132.2, 4921.3, 2166.1, 4992.2, 2162.5);
      ctx.bezierCurveTo(5007.7, 2160.9, 5035.0, 2178.9, 5051.3, 2173.9);
      ctx.bezierCurveTo(5122.4, 2150.5, 5177.3, 2203.5, 5225.1, 2241.7);
      ctx.bezierCurveTo(5250.1, 2259.8, 5282.9, 2262.5, 5308.5, 2268.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5311.5, 2269.5);
      ctx.bezierCurveTo(5356.7, 2272.4, 5363.6, 2266.0, 5386.3, 2259.6);
      ctx.bezierCurveTo(5404.9, 2258.1, 5420.8, 2258.5, 5436.5, 2247.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5309.5, 2270.5);
      ctx.bezierCurveTo(5355.8, 2316.6, 5326.5, 2346.6, 5345.0, 2363.9);
      ctx.bezierCurveTo(5397.0, 2444.5, 5355.0, 2452.0, 5376.5, 2495.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5176.5, 2614.5);
      ctx.bezierCurveTo(5186.5, 2608.3, 5191.9, 2604.7, 5201.1, 2595.7);
      ctx.bezierCurveTo(5221.6, 2573.3, 5232.6, 2582.5, 5242.5, 2572.7);
      ctx.bezierCurveTo(5281.2, 2533.3, 5327.6, 2512.9, 5376.5, 2497.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5378.5, 2497.5);
      ctx.bezierCurveTo(5446.4, 2493.8, 5467.0, 2519.6, 5495.6, 2476.9);
      ctx.bezierCurveTo(5502.9, 2465.6, 5517.7, 2458.4, 5532.3, 2454.0);
      ctx.bezierCurveTo(5559.2, 2434.9, 5565.6, 2408.6, 5600.9, 2392.0);
      ctx.bezierCurveTo(5629.2, 2371.7, 5638.6, 2372.7, 5664.6, 2364.0);
      ctx.bezierCurveTo(5705.4, 2336.9, 5692.0, 2333.8, 5733.2, 2330.7);
      ctx.bezierCurveTo(5777.6, 2323.1, 5779.6, 2258.9, 5826.5, 2265.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5826.5, 2266.5);
      ctx.lineTo(5840.3, 2268.6);
      ctx.bezierCurveTo(5844.4, 2269.2, 5848.5, 2268.7, 5852.3, 2267.1);
      ctx.lineTo(5867.7, 2259.1);
      ctx.bezierCurveTo(5870.2, 2258.0, 5872.5, 2256.6, 5874.6, 2254.8);
      ctx.lineTo(5884.1, 2247.5);
      ctx.bezierCurveTo(5888.3, 2244.2, 5893.1, 2241.5, 5898.1, 2239.5);
      ctx.lineTo(5914.1, 2232.1);
      ctx.bezierCurveTo(5916.4, 2231.0, 5918.6, 2229.9, 5920.8, 2228.6);
      ctx.lineTo(5931.2, 2221.2);
      ctx.bezierCurveTo(5935.4, 2218.8, 5939.9, 2217.1, 5944.7, 2216.4);
      ctx.lineTo(5959.7, 2214.4);
      ctx.bezierCurveTo(5968.9, 2213.1, 5978.2, 2212.9, 5987.4, 2213.6);
      ctx.lineTo(6012.5, 2215.5);
      ctx.lineTo(6025.0, 2216.1);
      ctx.bezierCurveTo(6031.3, 2216.4, 6037.3, 2218.1, 6042.8, 2221.0);
      ctx.lineTo(6048.8, 2224.3);
      ctx.bezierCurveTo(6053.9, 2227.1, 6058.0, 2231.1, 6060.9, 2236.0);
      ctx.lineTo(6068.4, 2248.9);
      ctx.bezierCurveTo(6071.7, 2254.5, 6076.7, 2258.9, 6082.6, 2261.6);
      ctx.lineTo(6099.0, 2271.0);
      ctx.bezierCurveTo(6110.0, 2276.0, 6121.4, 2279.8, 6133.2, 2282.5);
      ctx.lineTo(6159.6, 2287.0);
      ctx.bezierCurveTo(6165.5, 2288.0, 6171.5, 2288.4, 6177.5, 2288.1);
      ctx.lineTo(6192.7, 2286.3);
      ctx.bezierCurveTo(6202.5, 2285.8, 6212.2, 2287.3, 6221.4, 2290.7);
      ctx.lineTo(6226.3, 2293.7);
      ctx.bezierCurveTo(6229.7, 2295.6, 6233.5, 2296.7, 6237.4, 2297.0);
      ctx.lineTo(6253.5, 2297.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6057.5, 2183.5);
      ctx.lineTo(6058.5, 2197.0);
      ctx.bezierCurveTo(6058.5, 2203.2, 6056.7, 2209.3, 6053.4, 2214.6);
      ctx.lineTo(6046.5, 2222.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6255.5, 2297.5);
      ctx.lineTo(6271.2, 2294.8);
      ctx.bezierCurveTo(6277.9, 2293.9, 6284.8, 2294.9, 6291.0, 2297.6);
      ctx.lineTo(6298.3, 2302.0);
      ctx.bezierCurveTo(6301.1, 2303.7, 6303.7, 2305.7, 6306.0, 2308.0);
      ctx.lineTo(6309.5, 2311.5);
      ctx.bezierCurveTo(6312.1, 2314.1, 6315.3, 2316.2, 6318.8, 2317.6);
      ctx.lineTo(6338.5, 2324.5);
      ctx.lineTo(6347.5, 2328.8);
      ctx.bezierCurveTo(6352.8, 2331.2, 6357.4, 2334.8, 6361.0, 2339.4);
      ctx.lineTo(6367.5, 2345.5);
      ctx.lineTo(6371.2, 2348.1);
      ctx.bezierCurveTo(6375.3, 2351.0, 6378.7, 2354.8, 6381.1, 2359.3);
      ctx.lineTo(6382.2, 2361.2);
      ctx.bezierCurveTo(6383.7, 2364.0, 6386.0, 2366.3, 6388.8, 2367.8);
      ctx.lineTo(6438.3, 2394.6);
      ctx.bezierCurveTo(6443.0, 2397.2, 6448.3, 2398.3, 6453.6, 2397.9);
      ctx.lineTo(6479.5, 2396.0);
      ctx.bezierCurveTo(6484.2, 2395.7, 6488.8, 2395.7, 6493.5, 2396.2);
      ctx.lineTo(6514.9, 2397.8);
      ctx.bezierCurveTo(6519.2, 2398.3, 6523.5, 2397.3, 6527.2, 2395.0);
      ctx.lineTo(6533.4, 2389.3);
      ctx.bezierCurveTo(6536.1, 2386.8, 6539.3, 2384.9, 6542.8, 2383.7);
      ctx.lineTo(6564.1, 2376.4);
      ctx.bezierCurveTo(6569.5, 2374.5, 6575.3, 2375.0, 6580.4, 2377.6);
      ctx.lineTo(6600.4, 2387.9);
      ctx.bezierCurveTo(6603.8, 2389.6, 6607.3, 2391.2, 6610.9, 2392.5);
      ctx.lineTo(6640.5, 2403.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6644.5, 2407.5);
      ctx.lineTo(6658.0, 2422.4);
      ctx.bezierCurveTo(6662.3, 2427.1, 6667.4, 2431.0, 6673.1, 2433.8);
      ctx.lineTo(6677.5, 2436.0);
      ctx.bezierCurveTo(6680.8, 2437.6, 6683.8, 2439.9, 6686.3, 2442.6);
      ctx.lineTo(6694.2, 2448.0);
      ctx.bezierCurveTo(6695.7, 2449.0, 6697.3, 2449.9, 6698.9, 2450.8);
      ctx.lineTo(6717.4, 2460.7);
      ctx.bezierCurveTo(6720.8, 2462.6, 6724.0, 2464.7, 6727.1, 2467.1);
      ctx.lineTo(6734.3, 2472.9);
      ctx.bezierCurveTo(6739.7, 2477.3, 6746.0, 2480.5, 6752.7, 2482.4);
      ctx.lineTo(6765.1, 2485.9);
      ctx.bezierCurveTo(6771.4, 2487.6, 6777.8, 2488.7, 6784.2, 2489.1);
      ctx.lineTo(6815.5, 2491.3);
      ctx.bezierCurveTo(6817.5, 2491.4, 6819.5, 2491.6, 6821.5, 2491.9);
      ctx.lineTo(6843.0, 2494.8);
      ctx.bezierCurveTo(6846.7, 2495.3, 6850.3, 2495.5, 6854.0, 2495.6);
      ctx.lineTo(6917.5, 2496.5);
      ctx.lineTo(6977.9, 2499.1);
      ctx.bezierCurveTo(6984.2, 2499.4, 6990.6, 2498.6, 6996.8, 2496.8);
      ctx.lineTo(7055.9, 2478.5);
      ctx.bezierCurveTo(7060.3, 2477.2, 7064.8, 2476.3, 7069.4, 2475.9);
      ctx.lineTo(7103.5, 2473.2);
      ctx.bezierCurveTo(7108.8, 2472.7, 7114.1, 2473.4, 7119.1, 2475.0);
      ctx.lineTo(7130.4, 2477.7);
      ctx.bezierCurveTo(7133.8, 2478.9, 7137.3, 2479.4, 7140.9, 2479.3);
      ctx.lineTo(7149.0, 2479.4);
      ctx.bezierCurveTo(7154.6, 2479.5, 7160.2, 2480.5, 7165.5, 2482.5);
      ctx.lineTo(7185.5, 2487.5);
      ctx.bezierCurveTo(7187.5, 2488.2, 7204.5, 2497.9, 7206.5, 2498.5);
      ctx.lineTo(7226.5, 2505.5);
      ctx.lineTo(7245.5, 2510.5);
      ctx.bezierCurveTo(7250.8, 2511.5, 7262.5, 2518.5, 7267.5, 2520.5);
      ctx.lineTo(7299.6, 2528.5);
      ctx.bezierCurveTo(7305.5, 2530.5, 7311.2, 2533.1, 7316.6, 2536.3);
      ctx.lineTo(7350.6, 2556.6);
      ctx.bezierCurveTo(7353.9, 2558.5, 7356.9, 2560.7, 7359.8, 2563.2);
      ctx.lineTo(7363.7, 2566.3);
      ctx.bezierCurveTo(7366.9, 2569.1, 7370.5, 2571.3, 7374.5, 2572.8);
      ctx.lineTo(7384.6, 2577.4);
      ctx.bezierCurveTo(7389.1, 2579.4, 7393.1, 2582.6, 7396.1, 2586.5);
      ctx.lineTo(7414.9, 2621.4);
      ctx.bezierCurveTo(7430.9, 2642.2, 7453.2, 2657.3, 7478.5, 2664.3);
      ctx.lineTo(7556.5, 2680.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(7551.0, 2679.4);
      ctx.bezierCurveTo(7583.4, 2683.3, 7613.4, 2687.8, 7639.6, 2686.5);
      ctx.bezierCurveTo(7794.3, 2682.5, 7843.6, 2705.3, 7935.8, 2765.3);
      ctx.bezierCurveTo(7988.8, 2787.9, 8060.8, 2812.6, 8111.2, 2823.4);
      ctx.bezierCurveTo(8153.7, 2833.1, 8160.6, 2832.0, 8185.6, 2842.3);
      ctx.bezierCurveTo(8226.8, 2860.7, 8234.2, 2867.7, 8264.2, 2860.4);
      ctx.bezierCurveTo(8304.9, 2852.3, 8320.5, 2854.5, 8354.5, 2860.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(8347.3, 2859.2);
      ctx.bezierCurveTo(8428.4, 2873.2, 8398.4, 2895.8, 8439.4, 2920.8);
      ctx.bezierCurveTo(8529.5, 2942.4, 8570.1, 2907.4, 8602.3, 2977.8);
      ctx.bezierCurveTo(8611.8, 2988.0, 8626.6, 2988.6, 8634.4, 3001.1);
      ctx.bezierCurveTo(8650.2, 3023.4, 8647.9, 3072.6, 8666.4, 3078.9);
      ctx.bezierCurveTo(8721.3, 3105.7, 8711.8, 3039.1, 8785.1, 3025.4);
      ctx.bezierCurveTo(8832.8, 3004.2, 8851.8, 3005.2, 8875.4, 3004.0);
      ctx.bezierCurveTo(8891.5, 3003.5, 8922.3, 2992.2, 8937.3, 2991.5);
      ctx.bezierCurveTo(9000.2, 2994.2, 9010.6, 2953.5, 9067.8, 2942.4);
      ctx.bezierCurveTo(9109.4, 2927.2, 9112.7, 2894.8, 9132.5, 2901.0);
      ctx.bezierCurveTo(9177.2, 2911.4, 9212.8, 2896.4, 9231.4, 2906.4);
      ctx.bezierCurveTo(9276.0, 2926.9, 9295.6, 2899.5, 9323.5, 2931.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9326.5, 2934.5);
      ctx.lineTo(9323.5, 2948.5);
      ctx.lineTo(9312.4, 2970.4);
      ctx.bezierCurveTo(9308.5, 2977.8, 9303.5, 2984.5, 9297.6, 2990.4);
      ctx.lineTo(9283.5, 3003.5);
      ctx.bezierCurveTo(9278.9, 3008.1, 9273.2, 3011.5, 9267.0, 3013.5);
      ctx.lineTo(9252.7, 3018.0);
      ctx.bezierCurveTo(9245.3, 3020.3, 9238.7, 3024.3, 9233.2, 3029.8);
      ctx.lineTo(9225.5, 3039.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9614.5, 3120.5);
      ctx.lineTo(9604.8, 3109.1);
      ctx.bezierCurveTo(9603.3, 3106.7, 9601.1, 3104.9, 9598.6, 3103.8);
      ctx.lineTo(9565.0, 3088.9);
      ctx.bezierCurveTo(9555.4, 3084.7, 9545.3, 3081.5, 9534.9, 3079.7);
      ctx.lineTo(9479.5, 3070.4);
      ctx.bezierCurveTo(9468.9, 3068.5, 9458.0, 3067.7, 9447.2, 3068.1);
      ctx.lineTo(9367.9, 3068.6);
      ctx.bezierCurveTo(9357.7, 3068.5, 9347.5, 3067.3, 9337.5, 3065.0);
      ctx.lineTo(9251.5, 3044.5);
      ctx.lineTo(9221.5, 3038.5);
      ctx.bezierCurveTo(9215.4, 3037.3, 9203.5, 3036.5, 9192.5, 3035.5);
      ctx.lineTo(9177.5, 3035.5);
      ctx.bezierCurveTo(9137.5, 3042.5, 9101.5, 3056.5, 9065.7, 3078.4);
      ctx.lineTo(9051.3, 3088.8);
      ctx.bezierCurveTo(9038.9, 3099.2, 9028.2, 3111.6, 9019.8, 3125.5);
      ctx.lineTo(9001.3, 3160.1);
      ctx.bezierCurveTo(8994.8, 3171.7, 8987.3, 3182.7, 8978.9, 3193.0);
      ctx.lineTo(8954.3, 3221.5);
      ctx.bezierCurveTo(8947.1, 3230.1, 8939.1, 3238.1, 8930.3, 3245.1);
      ctx.lineTo(8920.2, 3255.6);
      ctx.bezierCurveTo(8896.0, 3274.6, 8867.9, 3287.9, 8837.9, 3294.6);
      ctx.lineTo(8810.7, 3298.5);
      ctx.bezierCurveTo(8796.7, 3301.1, 8783.3, 3306.4, 8771.2, 3314.0);
      ctx.lineTo(8755.4, 3325.2);
      ctx.bezierCurveTo(8749.5, 3329.4, 8743.9, 3334.1, 8738.9, 3339.4);
      ctx.lineTo(8718.5, 3358.5);
      ctx.bezierCurveTo(8715.6, 3361.4, 8711.5, 3369.3, 8709.4, 3372.9);
      ctx.lineTo(8699.5, 3392.6);
      ctx.bezierCurveTo(8689.6, 3409.1, 8677.4, 3424.2, 8663.4, 3437.5);
      ctx.lineTo(8628.6, 3469.2);
      ctx.bezierCurveTo(8623.2, 3474.1, 8617.6, 3478.6, 8611.7, 3482.9);
      ctx.lineTo(8591.9, 3497.6);
      ctx.bezierCurveTo(8583.0, 3504.2, 8573.6, 3510.1, 8563.8, 3515.4);
      ctx.lineTo(8518.1, 3539.2);
      ctx.bezierCurveTo(8502.5, 3547.4, 8488.0, 3557.7, 8475.2, 3569.8);
      ctx.lineTo(8468.7, 3576.0);
      ctx.bezierCurveTo(8460.0, 3584.2, 8453.0, 3590.4, 8448.5, 3601.5);
      ctx.lineTo(8446.5, 3608.2);
      ctx.bezierCurveTo(8443.3, 3616.1, 8442.4, 3629.6, 8445.5, 3637.5);
      ctx.lineTo(8455.5, 3655.1);
      ctx.bezierCurveTo(8460.2, 3663.4, 8465.3, 3671.3, 8471.0, 3678.9);
      ctx.lineTo(8499.5, 3715.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9611.5, 3124.5);
      ctx.lineTo(9596.5, 3147.5);
      ctx.lineTo(9568.1, 3186.1);
      ctx.bezierCurveTo(9563.1, 3193.0, 9558.6, 3200.4, 9554.7, 3208.0);
      ctx.lineTo(9537.5, 3238.5);
      ctx.lineTo(9524.2, 3265.4);
      ctx.bezierCurveTo(9518.4, 3278.1, 9511.6, 3290.3, 9503.8, 3302.0);
      ctx.lineTo(9474.5, 3346.8);
      ctx.bezierCurveTo(9468.5, 3355.9, 9461.1, 3363.8, 9452.4, 3370.3);
      ctx.lineTo(9432.7, 3383.4);
      ctx.bezierCurveTo(9422.6, 3390.1, 9412.0, 3396.2, 9401.1, 3401.5);
      ctx.lineTo(9354.0, 3424.4);
      ctx.bezierCurveTo(9344.3, 3429.1, 9323.8, 3437.4, 9313.5, 3440.5);
      ctx.lineTo(9240.5, 3461.5);
      ctx.lineTo(9144.5, 3485.5);
      ctx.bezierCurveTo(9139.2, 3486.9, 9082.9, 3502.5, 9077.5, 3503.5);
      ctx.lineTo(9020.0, 3512.9);
      ctx.bezierCurveTo(9009.7, 3514.6, 8999.5, 3517.3, 8989.7, 3520.8);
      ctx.lineTo(8932.4, 3540.8);
      ctx.bezierCurveTo(8921.8, 3544.6, 8911.6, 3549.4, 8901.9, 3555.0);
      ctx.lineTo(8817.5, 3604.5);
      ctx.lineTo(8766.5, 3628.8);
      ctx.bezierCurveTo(8759.8, 3631.9, 8735.5, 3641.1, 8728.5, 3643.5);
      ctx.lineTo(8674.3, 3663.5);
      ctx.bezierCurveTo(8665.1, 3666.8, 8655.7, 3669.3, 8646.1, 3671.0);
      ctx.lineTo(8625.5, 3674.3);
      ctx.bezierCurveTo(8618.8, 3675.8, 8612.1, 3676.6, 8605.3, 3676.9);
      ctx.lineTo(8582.9, 3678.9);
      ctx.bezierCurveTo(8563.5, 3681.3, 8544.5, 3685.8, 8527.5, 3695.5);
      ctx.lineTo(8509.5, 3708.5);
      ctx.lineTo(8489.5, 3721.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9456.5, 4090.5);
      ctx.lineTo(9448.9, 4050.9);
      ctx.bezierCurveTo(9447.3, 4042.6, 9445.2, 4034.5, 9442.6, 4026.5);
      ctx.lineTo(9420.7, 3959.4);
      ctx.bezierCurveTo(9417.9, 3950.8, 9414.7, 3942.4, 9411.1, 3934.1);
      ctx.lineTo(9380.5, 3864.5);
      ctx.lineTo(9371.3, 3843.0);
      ctx.bezierCurveTo(9364.9, 3819.2, 9365.7, 3794.1, 9373.6, 3770.7);
      ctx.lineTo(9390.5, 3734.5);
      ctx.lineTo(9402.1, 3704.1);
      ctx.bezierCurveTo(9407.0, 3688.9, 9408.5, 3672.7, 9406.2, 3656.8);
      ctx.bezierCurveTo(9404.8, 3647.1, 9401.4, 3635.6, 9398.1, 3628.7);
      ctx.bezierCurveTo(9394.6, 3621.0, 9389.0, 3614.5, 9382.1, 3609.8);
      ctx.lineTo(9358.5, 3594.5);
      ctx.lineTo(9338.5, 3580.5);
      ctx.bezierCurveTo(9327.6, 3565.7, 9320.9, 3537.3, 9323.4, 3519.1);
      ctx.lineTo(9334.5, 3470.5);
      ctx.lineTo(9343.4, 3429.2);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9456.9, 4091.7);
      ctx.lineTo(9501.9, 4098.9);
      ctx.bezierCurveTo(9509.6, 4100.0, 9517.3, 4101.3, 9524.9, 4103.0);
      ctx.lineTo(9664.5, 4132.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9456.5, 4094.5);
      ctx.lineTo(9456.5, 4121.8);
      ctx.bezierCurveTo(9456.5, 4130.2, 9455.4, 4138.6, 9453.2, 4146.8);
      ctx.lineTo(9431.6, 4228.4);
      ctx.bezierCurveTo(9427.6, 4243.7, 9420.8, 4258.1, 9411.6, 4270.9);
      ctx.lineTo(9399.2, 4286.8);
      ctx.bezierCurveTo(9391.4, 4298.6, 9384.9, 4311.1, 9379.9, 4324.3);
      ctx.lineTo(9359.5, 4382.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9451.5, 4090.5);
      ctx.lineTo(9345.0, 4067.9);
      ctx.bezierCurveTo(9337.3, 4066.3, 9329.6, 4065.1, 9321.8, 4064.3);
      ctx.lineTo(9278.2, 4059.8);
      ctx.bezierCurveTo(9263.8, 4058.3, 9249.6, 4055.0, 9236.0, 4050.0);
      ctx.lineTo(9149.5, 4018.5);
      ctx.bezierCurveTo(9109.8, 4005.9, 9032.8, 4008.1, 8991.5, 4013.5);
      ctx.lineTo(8906.1, 4029.9);
      ctx.bezierCurveTo(8874.5, 4034.9, 8842.4, 4036.4, 8810.5, 4034.1);
      ctx.lineTo(8707.8, 4022.3);
      ctx.bezierCurveTo(8697.0, 4021.1, 8686.1, 4022.0, 8675.7, 4024.8);
      ctx.lineTo(8648.1, 4034.0);
      ctx.bezierCurveTo(8639.2, 4037.0, 8631.0, 4041.9, 8624.2, 4048.5);
      ctx.lineTo(8614.5, 4058.9);
      ctx.bezierCurveTo(8608.1, 4065.0, 8599.5, 4068.0, 8590.7, 4067.2);
      ctx.lineTo(8560.3, 4062.1);
      ctx.bezierCurveTo(8550.0, 4060.4, 8539.4, 4061.9, 8530.0, 4066.3);
      ctx.lineTo(8505.7, 4078.3);
      ctx.bezierCurveTo(8497.0, 4082.4, 8487.5, 4084.4, 8477.9, 4084.3);
      ctx.lineTo(8182.3, 4078.7);
      ctx.bezierCurveTo(8174.4, 4078.6, 8166.6, 4078.8, 8158.7, 4079.5);
      ctx.lineTo(8059.5, 4087.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(8493.5, 3718.9);
      ctx.lineTo(8478.5, 3726.5);
      ctx.lineTo(8472.4, 3729.1);
      ctx.bezierCurveTo(8457.9, 3735.3, 8441.8, 3748.5, 8430.5, 3759.5);
      ctx.lineTo(8405.5, 3782.5);
      ctx.lineTo(8337.3, 3849.5);
      ctx.bezierCurveTo(8327.6, 3858.7, 8315.9, 3865.8, 8303.2, 3870.2);
      ctx.lineTo(8269.7, 3881.5);
      ctx.bezierCurveTo(8235.7, 3894.8, 8203.7, 3912.7, 8174.7, 3934.7);
      ctx.lineTo(8159.2, 3945.1);
      ctx.bezierCurveTo(8144.2, 3955.3, 8131.2, 3968.2, 8120.9, 3983.1);
      ctx.lineTo(8117.5, 3988.1);
      ctx.bezierCurveTo(8112.8, 3993.7, 8107.8, 3999.0, 8102.4, 4003.9);
      ctx.lineTo(8084.4, 4019.6);
      ctx.bezierCurveTo(8075.9, 4027.4, 8069.4, 4037.1, 8065.3, 4047.9);
      ctx.lineTo(8061.5, 4060.5);
      ctx.lineTo(8059.5, 4084.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(8059.5, 4090.5);
      ctx.lineTo(8060.6, 4098.9);
      ctx.bezierCurveTo(8061.2, 4103.3, 8061.1, 4107.7, 8060.3, 4112.1);
      ctx.lineTo(8058.9, 4123.6);
      ctx.bezierCurveTo(8058.0, 4130.8, 8056.0, 4137.9, 8053.0, 4144.5);
      ctx.lineTo(8043.5, 4158.5);
      ctx.lineTo(8031.5, 4177.5);
      ctx.lineTo(7997.5, 4245.5);
      ctx.lineTo(7979.5, 4282.5);
      ctx.lineTo(7974.2, 4291.0);
      ctx.bezierCurveTo(7969.1, 4299.3, 7962.9, 4306.9, 7955.7, 4313.5);
      ctx.lineTo(7934.4, 4333.2);
      ctx.bezierCurveTo(7929.1, 4338.1, 7923.5, 4342.4, 7917.5, 4346.3);
      ctx.lineTo(7898.9, 4358.1);
      ctx.bezierCurveTo(7893.3, 4361.7, 7888.2, 4365.9, 7883.7, 4370.8);
      ctx.lineTo(7858.5, 4397.5);
      ctx.lineTo(7837.5, 4424.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9076.5, 4428.5);
      ctx.lineTo(9060.5, 4428.5);
      ctx.lineTo(9014.1, 4431.7);
      ctx.bezierCurveTo(9007.0, 4432.2, 9000.0, 4432.3, 8992.9, 4431.9);
      ctx.lineTo(8940.5, 4428.5);
      ctx.lineTo(8876.6, 4425.7);
      ctx.bezierCurveTo(8873.2, 4425.6, 8869.8, 4425.3, 8866.5, 4424.9);
      ctx.lineTo(8815.1, 4419.4);
      ctx.bezierCurveTo(8809.4, 4418.8, 8803.6, 4418.5, 8797.8, 4418.5);
      ctx.lineTo(8766.5, 4418.5);
      ctx.lineTo(8726.8, 4421.6);
      ctx.bezierCurveTo(8719.3, 4422.2, 8711.8, 4423.3, 8704.4, 4424.8);
      ctx.lineTo(8673.3, 4431.1);
      ctx.bezierCurveTo(8668.8, 4432.0, 8664.3, 4433.2, 8659.9, 4434.5);
      ctx.lineTo(8635.3, 4442.1);
      ctx.bezierCurveTo(8630.1, 4443.7, 8624.8, 4445.0, 8619.5, 4445.9);
      ctx.lineTo(8576.5, 4453.5);
      ctx.lineTo(8530.2, 4460.0);
      ctx.bezierCurveTo(8520.4, 4461.0, 8510.6, 4461.2, 8500.8, 4460.6);
      ctx.lineTo(8476.3, 4457.9);
      ctx.bezierCurveTo(8466.5, 4457.0, 8456.7, 4455.2, 8447.1, 4452.6);
      ctx.lineTo(8407.1, 4441.6);
      ctx.bezierCurveTo(8404.0, 4440.9, 8400.9, 4440.3, 8397.8, 4439.8);
      ctx.lineTo(8360.0, 4434.3);
      ctx.bezierCurveTo(8356.3, 4433.8, 8352.6, 4433.5, 8348.9, 4433.4);
      ctx.lineTo(8285.4, 4431.7);
      ctx.bezierCurveTo(8276.9, 4431.6, 8268.4, 4430.0, 8260.3, 4427.1);
      ctx.lineTo(8230.5, 4416.5);
      ctx.lineTo(8189.5, 4403.7);
      ctx.bezierCurveTo(8183.5, 4401.6, 8177.3, 4400.0, 8171.1, 4399.0);
      ctx.lineTo(8109.3, 4389.9);
      ctx.bezierCurveTo(8102.8, 4389.0, 8096.3, 4387.6, 8089.9, 4385.9);
      ctx.lineTo(8058.1, 4377.8);
      ctx.bezierCurveTo(8054.4, 4376.9, 8050.7, 4375.9, 8047.0, 4374.7);
      ctx.lineTo(7973.5, 4350.5);
      ctx.lineTo(7932.0, 4335.4);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9078.5, 4430.5);
      ctx.lineTo(9080.4, 4432.7);
      ctx.bezierCurveTo(9083.8, 4436.6, 9086.7, 4440.8, 9089.2, 4445.3);
      ctx.lineTo(9093.8, 4453.8);
      ctx.bezierCurveTo(9102.2, 4466.9, 9112.0, 4479.1, 9122.9, 4490.2);
      ctx.lineTo(9155.5, 4523.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9076.5, 4426.5);
      ctx.lineTo(9126.5, 4418.5);
      ctx.lineTo(9172.1, 4411.3);
      ctx.bezierCurveTo(9179.7, 4410.1, 9187.4, 4409.4, 9195.1, 4409.1);
      ctx.lineTo(9220.8, 4407.3);
      ctx.bezierCurveTo(9235.9, 4406.8, 9251.0, 4408.0, 9265.8, 4411.0);
      ctx.lineTo(9276.5, 4414.5);
      ctx.bezierCurveTo(9284.5, 4417.2, 9292.7, 4419.0, 9301.0, 4420.1);
      ctx.lineTo(9324.9, 4422.1);
      ctx.bezierCurveTo(9328.0, 4422.4, 9331.0, 4422.5, 9334.1, 4422.5);
      ctx.lineTo(9351.5, 4422.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(8056.5, 4087.5);
      ctx.lineTo(8011.5, 4094.5);
      ctx.lineTo(7961.8, 4101.7);
      ctx.bezierCurveTo(7953.6, 4102.9, 7945.3, 4103.5, 7937.0, 4103.5);
      ctx.lineTo(7896.2, 4103.5);
      ctx.bezierCurveTo(7889.1, 4103.5, 7881.9, 4103.1, 7874.9, 4102.2);
      ctx.lineTo(7850.8, 4099.2);
      ctx.bezierCurveTo(7831.4, 4096.7, 7812.6, 4091.0, 7795.1, 4082.2);
      ctx.lineTo(7738.5, 4053.5);
      ctx.lineTo(7678.7, 4024.1);
      ctx.bezierCurveTo(7675.3, 4022.4, 7671.6, 4021.2, 7667.8, 4020.6);
      ctx.lineTo(7640.8, 4015.6);
      ctx.bezierCurveTo(7631.3, 4014.2, 7621.7, 4014.4, 7612.3, 4016.2);
      ctx.lineTo(7585.5, 4022.8);
      ctx.bezierCurveTo(7577.6, 4024.6, 7570.1, 4027.9, 7563.5, 4032.7);
      ctx.lineTo(7529.5, 4059.5);
      ctx.lineTo(7510.4, 4078.3);
      ctx.bezierCurveTo(7501.5, 4088.7, 7497.2, 4102.2, 7498.5, 4115.8);
      ctx.lineTo(7499.5, 4125.5);
      ctx.bezierCurveTo(7502.8, 4139.3, 7509.1, 4152.3, 7517.9, 4163.4);
      ctx.lineTo(7528.6, 4173.8);
      ctx.bezierCurveTo(7534.5, 4179.6, 7541.1, 4184.6, 7548.2, 4188.9);
      ctx.lineTo(7582.5, 4209.5);
      ctx.lineTo(7630.0, 4237.9);
      ctx.bezierCurveTo(7637.8, 4243.3, 7642.4, 4252.2, 7642.2, 4261.7);
      ctx.lineTo(7640.5, 4286.8);
      ctx.bezierCurveTo(7639.8, 4292.6, 7638.1, 4298.1, 7635.5, 4303.2);
      ctx.lineTo(7624.5, 4323.5);
      ctx.bezierCurveTo(7616.7, 4337.9, 7606.5, 4352.1, 7596.6, 4365.1);
      ctx.lineTo(7571.1, 4399.9);
      ctx.bezierCurveTo(7567.4, 4404.9, 7563.9, 4410.2, 7560.6, 4415.6);
      ctx.lineTo(7529.5, 4466.5);
      ctx.lineTo(7491.5, 4524.5);
      ctx.lineTo(7482.2, 4538.3);
      ctx.bezierCurveTo(7473.1, 4551.8, 7463.2, 4564.7, 7452.5, 4577.0);
      ctx.lineTo(7436.5, 4595.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(7434.5, 4599.5);
      ctx.lineTo(7448.5, 4612.5);
      ctx.lineTo(7466.6, 4630.6);
      ctx.bezierCurveTo(7470.5, 4634.5, 7474.6, 4638.3, 7478.9, 4641.8);
      ctx.lineTo(7488.6, 4649.8);
      ctx.bezierCurveTo(7500.5, 4659.6, 7513.4, 4668.1, 7527.0, 4675.3);
      ctx.lineTo(7536.2, 4679.7);
      ctx.bezierCurveTo(7542.4, 4682.2, 7548.4, 4685.2, 7554.1, 4688.5);
      ctx.lineTo(7562.2, 4693.0);
      ctx.bezierCurveTo(7566.4, 4695.3, 7570.5, 4697.9, 7574.4, 4700.6);
      ctx.lineTo(7615.5, 4729.5);
      ctx.lineTo(7657.3, 4758.9);
      ctx.bezierCurveTo(7660.8, 4761.3, 7664.2, 4763.8, 7667.5, 4766.4);
      ctx.lineTo(7696.5, 4788.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(7699.5, 4788.5);
      ctx.lineTo(7713.5, 4791.5);
      ctx.lineTo(7733.3, 4791.4);
      ctx.bezierCurveTo(7743.4, 4790.8, 7753.6, 4790.9, 7763.7, 4791.8);
      ctx.lineTo(7807.5, 4794.5);
      ctx.lineTo(7858.3, 4795.9);
      ctx.bezierCurveTo(7866.4, 4796.3, 7875.4, 4796.5, 7883.5, 4795.5);
      ctx.lineTo(7903.0, 4793.9);
      ctx.bezierCurveTo(7921.3, 4792.3, 7939.3, 4788.8, 7956.9, 4783.5);
      ctx.lineTo(7996.5, 4772.5);
      ctx.lineTo(8035.1, 4762.8);
      ctx.bezierCurveTo(8045.3, 4760.6, 8055.8, 4759.5, 8066.2, 4759.5);
      ctx.lineTo(8106.8, 4759.5);
      ctx.bezierCurveTo(8115.9, 4759.5, 8125.0, 4760.2, 8134.0, 4761.5);
      ctx.lineTo(8168.9, 4766.7);
      ctx.bezierCurveTo(8172.6, 4767.2, 8176.4, 4767.9, 8180.1, 4768.7);
      ctx.lineTo(8225.5, 4778.5);
      ctx.lineTo(8252.5, 4782.0);
      ctx.bezierCurveTo(8264.5, 4783.0, 8276.5, 4783.1, 8288.5, 4782.3);
      ctx.lineTo(8314.5, 4780.5);
      ctx.lineTo(8344.2, 4776.5);
      ctx.bezierCurveTo(8359.7, 4773.8, 8374.9, 4769.8, 8389.7, 4764.4);
      ctx.lineTo(8408.7, 4756.5);
      ctx.bezierCurveTo(8415.9, 4753.8, 8422.9, 4750.8, 8429.8, 4747.3);
      ctx.lineTo(8467.5, 4728.5);
      ctx.lineTo(8490.5, 4716.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(7696.5, 4790.5);
      ctx.lineTo(7692.8, 4791.2);
      ctx.bezierCurveTo(7683.9, 4792.7, 7675.3, 4795.2, 7667.0, 4798.6);
      ctx.lineTo(7651.9, 4804.7);
      ctx.bezierCurveTo(7642.3, 4808.6, 7632.5, 4812.0, 7622.6, 4814.9);
      ctx.lineTo(7580.5, 4827.5);
      ctx.lineTo(7547.4, 4833.2);
      ctx.bezierCurveTo(7534.8, 4835.4, 7522.1, 4836.2, 7509.3, 4835.7);
      ctx.lineTo(7478.8, 4833.8);
      ctx.bezierCurveTo(7475.9, 4833.6, 7473.0, 4833.5, 7470.2, 4833.5);
      ctx.lineTo(7395.5, 4832.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(7389.5, 4832.5);
      ctx.bezierCurveTo(7389.5, 4832.5, 7365.5, 4832.5, 7361.5, 4832.5);
      ctx.bezierCurveTo(7355.5, 4832.5, 7324.5, 4831.5, 7305.5, 4828.5);
      ctx.bezierCurveTo(7305.1, 4828.4, 7297.0, 4826.6, 7290.6, 4824.6);
      ctx.bezierCurveTo(7280.1, 4821.3, 7269.8, 4817.0, 7260.1, 4811.8);
      ctx.lineTo(7233.5, 4796.5);
      ctx.lineTo(7206.1, 4780.2);
      ctx.bezierCurveTo(7203.0, 4778.4, 7199.9, 4776.7, 7196.8, 4775.0);
      ctx.lineTo(7153.5, 4752.5);
      ctx.lineTo(7130.2, 4742.3);
      ctx.bezierCurveTo(7124.4, 4739.8, 7118.4, 4737.8, 7112.2, 4736.4);
      ctx.lineTo(7094.5, 4732.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(7431.5, 4603.5);
      ctx.bezierCurveTo(7375.5, 4665.0, 7342.0, 4663.2, 7269.5, 4665.3);
      ctx.bezierCurveTo(7243.9, 4664.3, 7201.4, 4688.4, 7186.5, 4693.2);
      ctx.bezierCurveTo(7175.5, 4697.6, 7094.6, 4729.5, 7094.5, 4729.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(7092.5, 4732.5);
      ctx.lineTo(7086.5, 4729.6);
      ctx.bezierCurveTo(7075.2, 4724.2, 7063.4, 4720.0, 7051.2, 4717.0);
      ctx.lineTo(7035.3, 4713.1);
      ctx.bezierCurveTo(7028.1, 4711.4, 7020.8, 4710.1, 7013.4, 4709.4);
      ctx.lineTo(6953.5, 4703.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6487.5, 4182.5);
      ctx.lineTo(6487.4, 4182.2);
      ctx.bezierCurveTo(6484.8, 4173.2, 6480.1, 4165.0, 6473.7, 4158.2);
      ctx.lineTo(6472.9, 4157.3);
      ctx.bezierCurveTo(6452.9, 4136.4, 6428.2, 4120.6, 6400.8, 4111.3);
      ctx.lineTo(6381.4, 4103.4);
      ctx.bezierCurveTo(6369.5, 4098.1, 6356.0, 4092.2, 6345.5, 4084.5);
      ctx.lineTo(6314.5, 4059.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(6312.5, 4057.5);
      ctx.lineTo(6298.8, 4038.0);
      ctx.bezierCurveTo(6295.3, 4033.0, 6292.3, 4027.7, 6289.8, 4022.1);
      ctx.lineTo(6270.5, 3977.5);
      ctx.lineTo(6255.0, 3938.5);
      ctx.bezierCurveTo(6251.3, 3929.2, 6247.1, 3920.1, 6242.2, 3911.3);
      ctx.lineTo(6223.6, 3877.5);
      ctx.bezierCurveTo(6219.5, 3870.2, 6215.1, 3863.0, 6210.4, 3856.1);
      ctx.lineTo(6190.3, 3826.5);
      ctx.bezierCurveTo(6185.8, 3819.9, 6180.8, 3813.5, 6175.4, 3807.5);
      ctx.lineTo(6150.5, 3780.1);
      ctx.bezierCurveTo(6146.5, 3775.7, 6142.2, 3771.6, 6137.7, 3767.7);
      ctx.lineTo(6104.5, 3739.5);
      ctx.lineTo(6069.5, 3712.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9332.5, 6239.5);
      ctx.lineTo(9335.5, 6240.0);
      ctx.bezierCurveTo(9350.8, 6242.3, 9366.3, 6243.1, 9381.8, 6242.4);
      ctx.lineTo(9436.6, 6239.7);
      ctx.bezierCurveTo(9456.3, 6238.9, 9475.7, 6234.1, 9493.4, 6225.5);
      ctx.lineTo(9503.2, 6220.9);
      ctx.bezierCurveTo(9517.1, 6212.8, 9528.7, 6201.1, 9536.7, 6187.1);
      ctx.lineTo(9581.4, 6105.7);
      ctx.bezierCurveTo(9588.8, 6092.3, 9595.0, 6078.2, 9600.0, 6063.7);
      ctx.lineTo(9611.3, 6030.7);
      ctx.bezierCurveTo(9614.1, 6022.6, 9617.7, 6014.8, 9622.1, 6007.4);
      ctx.lineTo(9638.1, 5976.9);
      ctx.bezierCurveTo(9647.7, 5958.7, 9658.6, 5941.1, 9670.7, 5924.5);
      ctx.lineTo(9696.4, 5889.2);
      ctx.bezierCurveTo(9701.1, 5882.8, 9706.5, 5876.8, 9712.5, 5871.6);
      ctx.lineTo(9737.5, 5849.7);
      ctx.bezierCurveTo(9742.1, 5845.6, 9746.5, 5841.1, 9750.5, 5836.3);
      ctx.lineTo(9780.6, 5800.8);
      ctx.bezierCurveTo(9789.1, 5790.7, 9799.3, 5782.1, 9810.8, 5775.3);
      ctx.lineTo(9861.5, 5745.5);
      ctx.lineTo(9909.8, 5724.0);
      ctx.bezierCurveTo(9920.9, 5719.0, 9931.6, 5713.2, 9941.8, 5706.5);
      ctx.lineTo(9986.5, 5679.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(9335.5, 6239.5);
      ctx.lineTo(9302.5, 6234.5);
      ctx.lineTo(9215.1, 6224.7);
      ctx.bezierCurveTo(9208.0, 6223.9, 9201.0, 6223.5, 9193.9, 6223.5);
      ctx.lineTo(9150.7, 6223.5);
      ctx.bezierCurveTo(9140.0, 6223.5, 9129.6, 6226.0, 9120.1, 6230.9);
      ctx.lineTo(9109.8, 6236.2);
      ctx.bezierCurveTo(9101.7, 6240.3, 9092.8, 6242.9, 9083.7, 6243.6);
      ctx.lineTo(9052.7, 6246.0);
      ctx.bezierCurveTo(9040.0, 6247.0, 9027.2, 6245.7, 9015.0, 6242.3);
      ctx.lineTo(8958.0, 6226.2);
      ctx.bezierCurveTo(8951.7, 6224.4, 8945.2, 6223.1, 8938.7, 6222.3);
      ctx.lineTo(8804.5, 6205.5);
      ctx.lineTo(8703.2, 6188.6);
      ctx.bezierCurveTo(8698.7, 6187.9, 8694.3, 6187.0, 8689.9, 6185.9);
      ctx.lineTo(8623.9, 6169.8);
      ctx.bezierCurveTo(8617.6, 6168.3, 8611.5, 6166.3, 8605.5, 6164.0);
      ctx.lineTo(8576.0, 6152.6);
      ctx.bezierCurveTo(8572.3, 6151.2, 8568.6, 6150.0, 8564.8, 6148.9);
      ctx.lineTo(8462.5, 6119.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(8459.5, 6119.5);
      ctx.lineTo(8430.0, 6127.6);
      ctx.bezierCurveTo(8423.0, 6129.5, 8416.1, 6131.8, 8409.3, 6134.4);
      ctx.lineTo(8301.5, 6175.5);
      ctx.lineTo(8195.5, 6220.5);
      ctx.lineTo(8087.5, 6260.5);
      ctx.lineTo(8025.1, 6286.8);
      ctx.bezierCurveTo(8016.0, 6290.6, 8006.8, 6294.0, 7997.4, 6296.9);
      ctx.lineTo(7941.5, 6314.5);
      ctx.lineTo(7940.3, 6314.7);
      ctx.bezierCurveTo(7925.9, 6316.5, 7911.2, 6315.9, 7897.0, 6312.8);
      ctx.lineTo(7877.5, 6308.5);
      ctx.lineTo(7809.5, 6292.5);
      ctx.lineTo(7796.9, 6287.4);
      ctx.bezierCurveTo(7780.8, 6284.8, 7764.4, 6285.7, 7748.6, 6289.9);
      ctx.lineTo(7719.5, 6300.5);
      ctx.lineTo(7695.1, 6314.6);
      ctx.bezierCurveTo(7680.3, 6321.1, 7664.0, 6323.4, 7648.0, 6321.4);
      ctx.lineTo(7633.6, 6318.2);
      ctx.bezierCurveTo(7622.5, 6315.8, 7610.8, 6316.7, 7600.2, 6320.8);
      ctx.lineTo(7582.0, 6330.8);
      ctx.bezierCurveTo(7567.4, 6336.5, 7551.3, 6337.4, 7536.1, 6333.5);
      ctx.lineTo(7497.5, 6320.5);
      ctx.lineTo(7428.5, 6297.5);
      ctx.lineTo(7417.9, 6294.0);
      ctx.bezierCurveTo(7407.0, 6290.3, 7395.7, 6288.3, 7384.2, 6288.0);
      ctx.lineTo(7347.7, 6289.0);
      ctx.bezierCurveTo(7337.1, 6288.7, 7326.7, 6285.6, 7317.6, 6280.2);
      ctx.lineTo(7285.5, 6258.5);
      ctx.lineTo(7249.5, 6225.3);
      ctx.bezierCurveTo(7242.2, 6217.5, 7234.0, 6210.5, 7225.1, 6204.4);
      ctx.lineTo(7161.5, 6158.5);
      ctx.lineTo(7117.5, 6128.6);
      ctx.bezierCurveTo(7113.5, 6125.9, 7109.7, 6122.9, 7106.1, 6119.7);
      ctx.lineTo(7077.5, 6094.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(7071.5, 6094.5);
      ctx.lineTo(7045.5, 6100.5);
      ctx.lineTo(6962.5, 6108.5);
      ctx.lineTo(6865.5, 6111.5);
      ctx.lineTo(6797.5, 6108.5);
      ctx.lineTo(6735.5, 6102.5);
      ctx.lineTo(6703.8, 6095.2);
      ctx.bezierCurveTo(6692.9, 6092.7, 6682.3, 6089.5, 6672.0, 6085.4);
      ctx.lineTo(6621.5, 6065.5);
      ctx.lineTo(6553.5, 6036.5);
      ctx.lineTo(6522.2, 6025.5);
      ctx.bezierCurveTo(6507.2, 6020.2, 6491.4, 6017.5, 6475.5, 6017.5);
      ctx.lineTo(6447.5, 6017.5);
      ctx.lineTo(6398.5, 6021.5);
      ctx.lineTo(6332.5, 6035.5);
      ctx.lineTo(6295.2, 6038.5);
      ctx.bezierCurveTo(6278.1, 6039.8, 6261.0, 6038.9, 6244.2, 6035.6);
      ctx.lineTo(6217.5, 6030.5);
      ctx.lineTo(6161.4, 6006.2);
      ctx.bezierCurveTo(6149.5, 6001.1, 6138.0, 5995.0, 6127.1, 5988.0);
      ctx.lineTo(6073.5, 5953.5);
      ctx.lineTo(6017.5, 5914.5);
      ctx.lineTo(5992.3, 5899.7);
      ctx.bezierCurveTo(5978.5, 5891.6, 5963.5, 5886.1, 5947.8, 5883.4);
      ctx.lineTo(5917.4, 5878.2);
      ctx.bezierCurveTo(5899.6, 5875.1, 5881.4, 5874.5, 5863.4, 5876.6);
      ctx.lineTo(5849.3, 5878.2);
      ctx.bezierCurveTo(5836.2, 5879.7, 5823.3, 5883.0, 5811.1, 5888.1);
      ctx.lineTo(5768.5, 5905.5);
      ctx.lineTo(5697.5, 5930.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5708.7, 5926.5);
      ctx.lineTo(5693.5, 5931.5);
      ctx.lineTo(5671.9, 5937.1);
      ctx.bezierCurveTo(5663.0, 5939.3, 5653.8, 5940.5, 5644.7, 5940.5);
      ctx.lineTo(5638.1, 5940.5);
      ctx.bezierCurveTo(5631.7, 5940.5, 5625.3, 5940.0, 5619.0, 5939.0);
      ctx.lineTo(5584.5, 5933.5);
      ctx.lineTo(5559.2, 5927.2);
      ctx.bezierCurveTo(5552.1, 5925.4, 5544.8, 5924.2, 5537.5, 5923.7);
      ctx.lineTo(5514.8, 5922.1);
      ctx.bezierCurveTo(5509.3, 5921.7, 5503.7, 5921.6, 5498.2, 5921.7);
      ctx.lineTo(5421.5, 5923.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5708.5, 5924.5);
      ctx.bezierCurveTo(5709.3, 5948.8, 5699.6, 5965.2, 5686.3, 5994.8);
      ctx.bezierCurveTo(5669.2, 6032.7, 5632.4, 6079.5, 5618.8, 6130.7);
      ctx.bezierCurveTo(5598.7, 6216.1, 5586.3, 6321.8, 5544.5, 6404.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5347.5, 4258.5);
      ctx.bezierCurveTo(5350.1, 4269.5, 5350.3, 4279.0, 5346.6, 4288.3);
      ctx.bezierCurveTo(5316.9, 4368.7, 5358.8, 4426.8, 5381.3, 4495.2);
      ctx.bezierCurveTo(5410.4, 4595.5, 5331.3, 4638.4, 5314.5, 4720.7);
      ctx.bezierCurveTo(5284.1, 4905.2, 5319.0, 4890.5, 5374.5, 4948.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5370.3, 4944.2);
      ctx.lineTo(5396.5, 4967.5);
      ctx.lineTo(5426.2, 4998.1);
      ctx.bezierCurveTo(5429.7, 5001.7, 5433.1, 5005.5, 5436.3, 5009.4);
      ctx.lineTo(5462.6, 5041.9);
      ctx.bezierCurveTo(5464.5, 5044.3, 5466.5, 5046.7, 5468.6, 5049.0);
      ctx.lineTo(5491.0, 5073.8);
      ctx.bezierCurveTo(5498.7, 5082.2, 5507.0, 5090.1, 5515.9, 5097.1);
      ctx.lineTo(5522.8, 5102.6);
      ctx.bezierCurveTo(5528.6, 5107.2, 5534.8, 5111.2, 5541.4, 5114.6);
      ctx.lineTo(5552.7, 5120.4);
      ctx.bezierCurveTo(5567.2, 5127.8, 5582.4, 5133.5, 5598.2, 5137.5);
      ctx.lineTo(5637.7, 5147.5);
      ctx.bezierCurveTo(5640.2, 5148.2, 5642.7, 5149.0, 5645.1, 5150.1);
      ctx.lineTo(5656.7, 5155.4);
      ctx.bezierCurveTo(5667.0, 5160.0, 5675.6, 5167.7, 5681.4, 5177.3);
      ctx.lineTo(5690.6, 5192.7);
      ctx.bezierCurveTo(5694.5, 5199.1, 5696.8, 5206.4, 5697.3, 5213.9);
      ctx.lineTo(5698.9, 5236.8);
      ctx.bezierCurveTo(5699.3, 5241.8, 5698.4, 5246.9, 5696.2, 5251.5);
      ctx.lineTo(5681.5, 5282.5);
      ctx.lineTo(5665.4, 5309.5);
      ctx.bezierCurveTo(5660.9, 5316.7, 5658.4, 5325.0, 5658.1, 5333.5);
      ctx.lineTo(5658.4, 5349.6);
      ctx.bezierCurveTo(5658.5, 5352.2, 5658.9, 5354.8, 5659.5, 5357.2);
      ctx.lineTo(5674.5, 5410.5);
      ctx.stroke();

      // layer2/Path
      ctx.beginPath();
      ctx.moveTo(5672.8, 5404.5);
      ctx.lineTo(5677.5, 5419.5);
      ctx.lineTo(5682.3, 5444.1);
      ctx.bezierCurveTo(5683.1, 5448.3, 5683.5, 5452.7, 5683.5, 5457.1);
      ctx.lineTo(5683.5, 5469.0);
      ctx.bezierCurveTo(5683.5, 5474.6, 5682.7, 5480.2, 5681.1, 5485.6);
      ctx.lineTo(5674.6, 5507.5);
      ctx.bezierCurveTo(5673.2, 5512.2, 5671.5, 5516.7, 5669.4, 5521.1);
      ctx.lineTo(5658.1, 5545.0);
      ctx.bezierCurveTo(5657.0, 5547.3, 5656.0, 5549.7, 5655.2, 5552.1);
      ctx.lineTo(5648.9, 5568.8);
      ctx.bezierCurveTo(5646.0, 5576.5, 5644.5, 5584.7, 5644.5, 5593.0);
      ctx.lineTo(5644.5, 5604.7);
      ctx.bezierCurveTo(5644.5, 5609.9, 5645.1, 5615.0, 5646.4, 5620.1);
      ctx.lineTo(5651.1, 5639.1);
      ctx.bezierCurveTo(5652.0, 5642.7, 5653.2, 5646.2, 5654.6, 5649.7);
      ctx.lineTo(5669.2, 5686.1);
      ctx.bezierCurveTo(5670.1, 5688.4, 5670.8, 5690.7, 5671.4, 5693.0);
      ctx.lineTo(5682.2, 5734.3);
      ctx.bezierCurveTo(5683.1, 5737.8, 5683.8, 5741.3, 5684.3, 5744.8);
      ctx.lineTo(5692.8, 5800.6);
      ctx.bezierCurveTo(5693.3, 5803.9, 5693.8, 5807.1, 5694.5, 5810.3);
      ctx.lineTo(5702.1, 5846.1);
      ctx.bezierCurveTo(5703.7, 5853.7, 5704.9, 5861.4, 5705.7, 5869.1);
      ctx.lineTo(5707.4, 5884.7);
      ctx.bezierCurveTo(5708.1, 5891.9, 5708.5, 5899.1, 5708.5, 5906.4);
      ctx.lineTo(5708.5, 5929.6);
      ctx.stroke();
      ctx.restore();
	}
}

class vec2 {
	constructor(vec) {
		this.x = vec.x;
		this.y = vec.y;
	}

	length() {
		return Math.floor(Math.sqrt(Math.pow(Math.abs(this.x), 2) + Math.pow(Math.abs(this.y), 2)));
	}

	add(vector) {
		return new vec2({x:this.x + vector.x, y:this.y + vector.y});
	}

	sub(vector) {
		return new vec2({x:this.x - vector.x, y:this.y - vector.y});
	}

	lt(vector) {
		return (this.x < vector.x && this.y < vector.y);
	}
	lte(vector) {
		return (this.x <= vector.x && this.y <= vector.y);
	}
	gt(vector) {
		return (this.x > vector.x && this.y > vector.y);
	}
	gte(vector) {
		return (this.x >= vector.x && this.y >= vector.y);
	}
}

class boundingBox {
	constructor(topleft, bottomright) {
		this.tl = new vec2(topleft);
		this.br = new vec2(bottomright);
	}

	contains(point) {
		return (this.tl.lte(point) && this.br.gte(point));
	}
}