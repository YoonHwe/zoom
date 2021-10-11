const socket = io();

const myFace = document.querySelector("#myface");
const muteButton = document.querySelector("#mute");
const cameraButton = document.querySelector("#camera");
const cameraSelect = document.querySelector("#cameras");
let myStream;
let muted = false;
let cameraOff = false;

const welcome = document.querySelector("#welcome");
const call = document.querySelector("#call");
call.hidden = true;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
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

    }
}

async function getMedia(deviceId){
    const initialConstraints = {
        audio: true,
        video: {facingMode: "user"},
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
}

muteButton.addEventListener("click", muteClicked);
cameraButton.addEventListener("click", cameraClicked);
cameraSelect.addEventListener("input", cameraChange);

const welcomeForm = welcome.querySelector("form");

function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcome.querySelector("input");
    socket.emit("join_room", input.value, startMedia);
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);