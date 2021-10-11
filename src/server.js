import http from "http";
// import WebSocket from "ws";
import { Server }from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";


const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_,res) => res.render("home"));
app.get("/*", (_,res) => res.redirect("/"));

//아래를 통해 http서버와 webSocket서버 둘 다 돌릴 수 있음
const httpServer = http.createServer(app);//createServer를 하려면 requestListener 경로가 있어야 함 -> app. (express application으로부터 서버를 만드는 과정)
const wsServer = new Server(httpServer, {
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});
instrument(wsServer, {
    auth: false
});
function publicRooms(){
    const socketIds = wsServer.sockets.adapter.sids;
    const roomIds = wsServer.sockets.adapter.rooms;
    // const {sockets: {adapter: {sids, rooms}}} = wsServer; //위와 같은 의미
    const publicRooms = [];
    roomIds.forEach((_, key) => {
        if(socketIds.get(key) === undefined){
            publicRooms.push(key);
        }
    })
    return publicRooms;
}

function countRoom(roomName){
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
    socket["nickname"] = "anonymous";
    socket.onAny((event) => {
        console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (roomName, nickname, done) => {
        socket["nickname"] = nickname;
        socket.join(roomName);
        done();
        socket.to(roomName).emit("Welcome", socket.nickname, countRoom(roomName));
        wsServer.sockets.emit("room_change", publicRooms());
    });
    socket.on("disconnecting", () => {
        socket.rooms.forEach((room) => socket.to(room).emit("Bye", socket.nickname, countRoom(room)-1));
    });
    socket.on("disconnect", () => {
        wsServer.sockets.emit("room_change", publicRooms());
    })
    socket.on("new_message", (message, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${message}`);
        done();
    });
    socket.on("nickname", (nickname) => {
        socket["nickname"] = nickname;
    })
});

wsServer.on("connection", socket => {
    socket.on("join_room", (roomName, done) => {
        socket.join(roomName);
        done();
    })
});

function startMedia(){
    welcome.hidden = true;
    call.hidden = false;
    getMedia();
}
//const wss = new WebSocket.Server({ server });//webSocketServer를 만들었음 http서버 위에

// const sockets= [];

// wss.on("connection", (socket) => {
//     sockets.push(socket);
//     socket["nickname"] = "Anonymous";
//     console.log("Connected to Browser");
//     socket.on("close", () => {
//         console.log("Disconnected from the Browser");
//     })
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg);
//         switch(message.type){
//             case "new_message":
//                 sockets.forEach((aSocket) => 
//                     aSocket.send(`${socket.nickname}: ${message.payload}`)
//                 );
//                 break;
//             case "nickname":
//                 socket["nickname"] = message.payload;
//                 break;
//         }
//     });
// });
const handleListen = () => console.log(`Listening on http://localhost:3000`);
httpServer.listen(3000, handleListen);
