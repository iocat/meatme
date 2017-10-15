import { h, Component } from 'preact';
import googleMapLoader from 'google-maps';

var API_KEY = "AIzaSyBUDQdsSZ980zxItdb6-IHMzY2G-YtToJE";

class PlaceCard extends Component {
        /**
         * 
         * @param {!google.maps.Place} place 
         */
        getImgUrl(/** @type {!google.maps.Place} */place) {
                let placePhoto = null;
                if (place.photos && place.photos.length !== 0) {
                        placePhoto = place.photos[0].getUrl({ maxHeight: "500" })//"https://maps.googleapis.com/maps/api/place/photo?maxheight=40px&photoReference="+place.photos[0].photo_reference+"&key="+API_KEY;
                }
                return placePhoto;
        }
        getPhotoSubElem(photo) {
                if (photo === null) {
                        return null;
                }
                return <img class="card-img-top" src={photo} alt="Place's photo" />
        }
        getOpeningTags(/** @type {!google.maps.Place} */place) {
                let tag = null;
                if (!place.opening_hours) {
                        return null;
                }
                if (place.opening_hours.open_now === true) {
                        tag = <span class="badge badge-success">Open Now!</span>
                } else if (place.opening_hours.open_now === false) {
                        tag = <span class="badge badge-dark">Closed Now</span>
                }
                return tag;
        }

        getRating() {
                if (this.props.place.rating) {
                        return <p>
                                Rating: {this.props.place.rating}/5.0
                        </p>
                }
                return null;
        }
        render(props) {
                return <div class="card">
                        {this.getPhotoSubElem(this.getImgUrl(props.place))}
                        <div class="card-body">
                                {this.getOpeningTags(props.place)}
                                <h4 class="card-title">{props.place.name} </h4>
                                <h6 class="card-subtitle mb-2 text-muted">
                                        {props.place.vicinity}
                                </h6>
                                {this.getRating()}
                        </div>
                </div>
        }
}

class ChatRoom extends Component {
        /**
         * @param {!google.maps.Place} place 
         */
        constructor() {
                super();
                this.state = {
                        messageQ: [],
                        username: null,
                        usernameCreatedDismiss: false,
                        waitingForName: false,
                        error: null

                }
        }

        componentDidMount() {
                let msgRef = firebase.database().ref("places/" + this.props.place.place_id + "/messages");
                msgRef.orderByKey().once("value", (snapshot) => {
                        let newList = [];
                        snapshot.forEach(message => {
                                newList.push(message.val());
                        })
                        this.setState({ messageQ: newList })
                });
                msgRef.on("child_added",
                        (childSnapShot, prevKey) => {
                                let newList = this.state.messageQ.slice();
                                newList.push(childSnapShot.val());
                                this.setState({ messageQ: newList });
                                this.msgBoardScrollToBottom();
                        }
                );
        }

        isChatDisabled() {
                if (this.state.username === null) {
                        return true;
                }
                return false;
        }

        submitMessage() {
                let newMsg = $("#chat-msg-input").val().trim();
                if (newMsg.length === 0) {
                        return; // ignore empty messages
                }
                let msgRef = firebase.database().ref("places/" + this.props.place.place_id + "/messages");
                let newMsgRef = msgRef.push();
                newMsgRef.set({
                        "name": this.state.username,
                        "value": newMsg
                });
                $("#chat-msg-input").val(null)
        }

        getChatButton() {
                if (this.isChatDisabled()) {
                        return <button class="btn btn-secondary" disabled type="button">Go!</button>
                } else {
                        return <button class="btn btn-success" type="button" onClick={() => this.submitMessage()}>Go!</button>
                }
        }


        activateModal() {
                $('.username-setup.modal').modal('show');
        }

        closeModal() {
                $('.username-setup.modal').modal('hide');
        }

        chatInputKeyUp(event) {
                if (event.keyCode === 13) {
                        this.submitMessage();
                }
        }

        getChatInputElem() {
                if (this.isChatDisabled()) {
                        return <input type="text" class="form-control"
                                onClick={this.activateModal}
                                placeholder="Click to set up your username"
                                aria-label="Setup your username here..." />
                } else {
                        return <input type="text" id="chat-msg-input" onKeyUp={(event) => this.chatInputKeyUp(event)} class="form-control" placeholder="Enter your message..." aria-label="Your chat messages..." />
                }
        }

        onSubmitName() {
                this.setState({ waitingForName: true });
                let gotUsername = $("#username-input").val().trim();
                let userMapRef = firebase.database().ref("places/" + this.props.place.place_id + "/users/" + gotUsername)
                userMapRef.transaction((presence) => {
                        if (presence) {
                                return; // abort
                        }
                        return true;
                }, (error, committed) => {
                        if (error) {
                                this.setState({ waitingForName: false, error: "Something went wrong" });
                        } else if (!committed) {
                                this.setState({ waitingForName: false, error: "Username already exists" });
                        } else {
                                // succeed
                                this.setState({ waitingForName: false, username: gotUsername, error: null });
                        }
                        this.closeModal();
                });
        }

        getNameSubmitBtn() {
                if (this.state.waitingForName === false) {
                        return <button class="btn btn-success" type="button" onClick={() => { this.onSubmitName() }}>Submit</button>
                } else {
                        return <button class="btn btn-warning" type="button" disabled >
                                <span class="ion-refreshing">Loading</span>
                        </button>
                }
        }

        getErrorWarning() {
                if (this.state.error !== null) {
                        return <div class="alert alert-danger" role="alert">
                                {this.state.error}
                        </div>
                }
                return null;
        }

        getUsernameSetupNotice() {
                let onDismiss = () => { this.setState({ usernameCreatedDismiss: true }) }

                if (this.state.username === null) {
                        return <div class="alert alert-info" role="alert">
                                Please create a name and join the conversation!
                        </div>
                } else if (this.state.usernameCreatedDismiss) {
                        return null;
                } else {
                        return <div class="alert alert-warning alert-dismissible fade show" role="alert">
                                <button onClick={onDismiss} type="button" class="close" data-dismiss="alert" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                </button>
                                <strong>Holy guacamole!</strong> Your name is now "{this.state.username}".
                                </div>;
                }
        }

        msgBoardScrollToBottom() {
                let msgBoard = document.getElementById("msg-board");
                msgBoard.scrollTop = msgBoard.scrollHeight;
        }

        render(props, state) {
                return <div>
                        <div class="container">
                                {this.getUsernameSetupNotice()}
                                {this.getErrorWarning()}
                        </div>

                        <div class="card" style="height:auto; margin-top: 10px">
                                <div class="modal fade username-setup" tabindex="-1" role="dialog" aria-labelledby="myLargeModalLabel" aria-hidden="true">
                                        <div class="modal-dialog modal-sm">
                                                <div class="modal-content">
                                                        <div class="modal-header">
                                                                <h5 class="modal-title">Your Name</h5>
                                                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                                                        <span aria-hidden="true">&times;</span>
                                                                </button>
                                                        </div>
                                                        <div class="modal-body">
                                                                <div class="input-group" >
                                                                        <input type="text" id="username-input" class="form-control" placeholder="Your Username" aria-label="Enter your username." />
                                                                        <span class="input-group-btn">
                                                                                {this.getNameSubmitBtn()}
                                                                        </span>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                </div>
                                <div class="card-body">
                                        <div class="card-title">
                                                Messages
                                        </div>
                                        <div class="card-text">
                                                <div style="max-height:50vh; overflow-y: scroll; padding: 20px 20px 20px 20px" id="msg-board">
                                                        {state.messageQ && state.messageQ.map((mesg, index) => {
                                                                console.log(mesg)
                                                                return <div key={index}>
                                                                        <strong> {mesg.name} </strong>: {mesg.value}
                                                                </div>
                                                        })}
                                                </div>
                                        </div>
                                </div>
                        </div>
                        <div class="input-group" style="height:auto; margin-top: 10px">
                                {this.getChatInputElem()}
                                <span class="input-group-btn">
                                        {this.getChatButton()}
                                </span>
                        </div>
                </div>
        }
}

export default class PlacePage extends Component {
        constructor() {
                super();
                this.state = {
                        place: null,
                        error: null,
                };
        }

        componentDidMount() {
                let requestedId = this.props.id;
                googleMapLoader.KEY = API_KEY;
                googleMapLoader.LIBRARIES = ['geometry', 'places'];
                googleMapLoader.load((google) => {
                        let plServ = new google.maps.places.PlacesService(document.createElement("div"));
                        let place = plServ.getDetails({
                                placeId: requestedId,
                        }, (place, status) => {
                                if (status == google.maps.places.PlacesServiceStatus.OK) {
                                        this.setState({ place: place });
                                } else if (status == google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                                        this.setState({ error: "Error 404: Can't find the corresponding location" });
                                } else {
                                        this.setState({ error: "Something went wrong. Please check the provided location or try again" });
                                }
                        })
                });
        }


        render(props, state) {
                let placeId = props.id;
                if (state.error != null) {
                        console.log(state.error)
                        return <div style="padding-top: 100px">
                                <div class="container">
                                        <div class="alert alert-danger" role="alert">{state.error}</div>
                                </div>
                        </div>
                }
                if (state.place != null) {
                        return <div class="container" style="padding-top: 100px" >
                                <div class="row">
                                        <div class="col-sm-4">
                                                <div class="container">
                                                        <PlaceCard place={state.place} />
                                                </div>
                                                <div class="container">
                                                        <div class="card text-center" style="margin-top:10px">
                                                                <div class="card-body">
                                                                        <h1 class="card-title">Notice</h1>
                                                                        <p class="card-text">
                                                                                1) Please be considerate and respectful. <br />
                                                                                2) Please meet up physically.<br />
                                                                                3) Enjoy your meals.<br />
                                                                                <small>*All chat messages and users will be deleted at every 12am EDT*</small></p>
                                                                </div>
                                                        </div>
                                                </div>
                                        </div>
                                        <div class="col-sm-8">
                                                <ChatRoom place={state.place} />
                                        </div>
                                </div>
                        </div>
                }
                return null;
        }
}