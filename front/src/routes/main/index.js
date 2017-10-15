import { h, Component } from 'preact';
import style from './style';
import LocationPicker from './map/LocationPicker.js';
import {route} from 'preact-router';

export default class Home extends Component {
	onSelectPlace(/** @type {!google.maps.Place} */place){
		console.log("Place selected:", place)
		route("/places/"+place.placeId, false);
	}
	onChangePlace(/** @type {!google.maps.Place} */place){
		console.log("Place changed:", place)
	}
	render() {
		return (
			<div class={style.home}>
				<div class="container">
					<h3 class="text-center" style={{margin:"15px 0 15px 0"}}>Enter Your Dining Location</h3>
				</div>
				<div class="container">
					<LocationPicker onChangePlace={this.onChangePlace} onSelectPlace={this.onSelectPlace}/>
				</div>
			</div>
		);
	}
}
