import { h, Component } from 'preact';
import googleMapLoader from 'google-maps';

var API_KEY = "AIzaSyBUDQdsSZ980zxItdb6-IHMzY2G-YtToJE";

var currentPosition = null;

let getCurrentGeoLocation = (callback) => {
	if ("geolocation" in navigator) {
		navigator.geolocation.getCurrentPosition(function (position) {
			callback(position.coords.latitude, position.coords.longitude);
		})
	} else {
		return null;
	}
}

export default class LocationPicker extends Component {
	componentDidMount() {
		googleMapLoader.KEY = API_KEY;
		googleMapLoader.LIBRARIES = ['geometry', 'places'];
		let onChangePlace = this.props.onChangePlace;
		let onSelectPlace = this.props.onSelectPlace;
		googleMapLoader.load(function (google) {
			var mapOptions = {
				center: { lat: -33.8688, lng: 151.2195 },
				zoom: 13,
				scrollwheel: false
			};
			var map = new google.maps.Map(
				document.getElementById("map"), mapOptions);
			getCurrentGeoLocation(function (lat, lon) {
				map.setCenter({ lat: lat, lng: lon });
			})
			var input = document.getElementById("place-input");
			var autocomplete = new google.maps.places.Autocomplete(input, {
				types:["establishment"],
				type: "restaurant"
			});

			autocomplete.bindTo('bounds', map);
			map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
			var infowindow = new google.maps.InfoWindow();
			var marker = new google.maps.Marker({
				map: map
			});
			google.maps.event.addListener(marker, 'click', function () {
				infowindow.open(map, marker);
			});
			// Get the full place details when the user selects a place from the
			// list of suggestions.
			google.maps.event.addListener(autocomplete, 'place_changed', function () {
				infowindow.close();
				var place = autocomplete.getPlace();
				if (!place.geometry) {
					return;
				}

				if (place.geometry.viewport) {
					map.fitBounds(place.geometry.viewport);
				} else {
					map.setCenter(place.geometry.location);
					map.setZoom(18);
				}

				// Set the position of the marker using the place ID and location.
				marker.setPlace(/** @type {!google.maps.Place} */({
					placeId: place.place_id,
					location: place.geometry.location
				}));
				marker.setVisible(true);
				let placeName = place.name;
				let placeAddr = place.formatted_address;

				let placePhoto = null;
				if (place.photos && place.photos.length !== 0) {
					placePhoto = place.photos[0].getUrl({ maxHeight: "500" })//"https://maps.googleapis.com/maps/api/place/photo?maxheight=40px&photoReference="+place.photos[0].photo_reference+"&key="+API_KEY;
				}
				let placeCard = null;
				let placeCheckOutFn = function () { onSelectPlace(place) }
				if (placePhoto) {
					placeCard =
						`<div class="card" style="width: 100%;">
						<img class="card-img-top" style="max-height: 200px; width: auto" src="`+ placePhoto + `" alt="Card image cap" />
						<div class="card-body">
							<h4 class="card-title">`+ placeName + `</h4>
							<p class="card-text">`+ placeAddr + `</p>
							<a style="text-decoration: none" href="/places/`+ place.place_id + `">
								<button type="button" class="btn btn-success">
									Check It Out
								</button>
							</a>
						</div>
					</div>`;

				} else {
					placeCard = `<div class="card" style="width: 20rem;">
					<div class="card-body">
						<h4 class="card-title">`+ placeName + `</h4>
						<p class="card-text">`+ placeAddr + `</p>
							<a style="text-decoration: none" href="/places/`+ place.place_id + `">
								<button type="button" class="btn btn-success">
									Check It Out
								</button>
							</a>
						</div>
					</div>`;
				}
				infowindow.setContent(placeCard);

				//'<div><strong>' + place.name + '</strong><br>' +"Rating: "+ place.rating+"<br>"+ place.formatted_address + '</div>'
				infowindow.open(map, marker);


				if (onChangePlace != null && place) {
					onChangePlace(place);
				}
			});
		})
	}

	render(props) {
		return (<div>
			<input style={{ maxWidth: "70%", marginTop: "5px" }}
				id="place-input" type="text" placeholder="Wubba Lubba Dub Dub! I meant... let's eat!"
				class="form-control" aria-label="Your restaurant" />
			<div id="map" style={{ width: "100%", height: "80vh" }} />
		</div>);
	}
}