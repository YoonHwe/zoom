const socket = io();

const myFace = document.querySelector("#myface");
const muteButton = document.querySelector("#mute");
const cameraButton = document.querySelector("#camera");
const cameraSelect = document.querySelector("#cameras");
let myStream;
let muted = false;
let cameraOff = false;

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        cameras.forEach(camera => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            cameraSelect.appendChild(option);
        })
    }
    catch(e){

    }
}

async function getMedia(){
    try{
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true,
        });
        myFace.srcObject = myStream;
        await getCameras();
    }
    catch(e){
        console.log(e);
    }
}

getMedia();

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

muteButton.addEventListener("click", muteClicked);
cameraButton.addEventListener("click", cameraClicked);