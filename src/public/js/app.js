const socket = io();

const myFace = document.querySelector("#myface");
const muteButton = document.querySelector("#mute");
const cameraButton = document.querySelector("#camera");
const cameraSelect = document.querySelector("#cameras");
let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

const welcome = document.querySelector("#welcome");
const call = document.querySelector("#call");
call.hidden = true;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(currentCamera.label === camera.label){
                option.selected = true;
            }
            cameraSelect.appendChild(option);
        })
    }
    catch(e){
        console.log(e);
    }
}

async function getMedia(deviceId){
    const initialConstraints = {
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstraints = {
        audio: true,
        video: { deviceId: { exact: deviceId }},
    };
    try{
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstraints
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        }
    }
    catch(e){
        console.log(e);
    }
}


function muteClicked(){
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));

    if(!muted){
        muteButton.innerText = "Unmute";
        muted = true;
    }
    else{
        muteButton.innerText = "Mute";
        muted = false;
    }
}

function cameraClicked(){
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if(cameraOff){
        cameraButton.innerText = "Turn Camera Off";
        cameraOff = false;
    }
    else{
        cameraButton.innerText = "Turn Camera On";
        cameraOff = true;
    }
}

async function cameraChange(){
    await getMedia(cameraSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find(sender => sender.track.kind === "video");
        console.log(videoSender);
        videoSender.replaceTrack(videoTrack);
    }
}

muteButton.addEventListener("click", muteClicked);
cameraButton.addEventListener("click", cameraClicked);
cameraSelect.addEventListener("input", cameraChange);

//Welcome Form(join a room)

const welcomeForm = welcome.querySelector("form");

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    await initCall();
    socket.emit("join_room", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//Socket code
socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
});

socket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
    console.log("received the answer");
})

socket.on("ice", (ice) => {
    console.log("received candidate")
    myPeerConnection.addIceCandidate(ice);
})
//RTC code

function makeConnection(){
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
          {
            urls: [
              "stun:stun.l.google.com:19302",
              "stun:stun1.l.google.com:19302",
              "stun:stun2.l.google.com:19302",
              "stun:stun3.l.google.com:19302",
              "stun:stun4.l.google.com:19302",
            ],
          },
        ],
      });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
    socket.emit("ice", data.candidate, roomName);
    console.log("sent candidate")
    // console.log(data);
}

function handleAddStream(data){
    const peerFace = document.querySelector("#peerFace");
    console.log("peer's Stream", data.stream);
    peerFace.srcObject = data.stream;
}