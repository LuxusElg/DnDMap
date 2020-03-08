import React, { useState } from 'react';
import classNames from 'classnames';
import { Inertia } from '@inertiajs/inertia'
import Icon from '@/Shared/Icon';

export default function Map({ map, locations }) {

	const [pins, setPins] = useState(locations.map(loc => {
		return { 
			name: loc.name, 
			position: {x: loc.pin_x, y: loc.pin_y},
			size: loc.size,
		};
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
			const map = this.state.map;
			const context = canvas.getContext("2d");

			// clear the canvas
			context.clearRect(0, 0, canvas.width, canvas.height);

			// Save context state and apply transformation matrix
			context.save();
			context.transform(map.scale, 0, 0, map.scale, map.offset.x, map.offset.y);

			// Draw map and all map artifacts
			this.drawMap(context, img);
			this.drawRoads(context);
			this.drawIcons(context);

			// Restore context state
			context.restore();
	
			this.props.setRedraw(false);
		}
	}
	
	drawMap(context, img) {
		context.drawImage(img, 0, 0, img.width, img.height);
	}


	drawIcons(ctx) {
		for (const pin of this.props.pins) {
			let pos = pin.position;
			ctx.beginPath();
			ctx.arc(pos.x, pos.y, (pin.size / 5), 0, 2 * Math.PI, false);
			ctx.fillStyle = '#F56565';
			ctx.lineWidth = 8;
			ctx.strokeStyle = '#1A202C';
			ctx.stroke();
			ctx.fill();

			ctx.lineWidth = 8;
			ctx.font = (50 * Math.log(pin.size)/5)+'px Times New Roman';
			const textPos = {x: pos.x + 20, y: pos.y + 5}
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

	drawRoads(ctx) {
		// layer2/Path
		ctx.save();
		ctx.beginPath();
		ctx.strokeStyle = '#F56565';
		ctx.lineWidth = 3.0;
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
		ctx.restore();
	}
}