import http from "http";
import WebSocket from "ws";
import express from "express";


const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_,res) => res.render("home"));
app.get("/*", (_,res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);

//아래를 통해 http서버와 webSocket서버 둘 다 돌릴 수 있음
const server = http.createServer(app);//createServer를 하려면 requestListener 경로가 있어야 함 -> app. (express application으로부터 서버를 만드는 과정)

const wss = new WebSocket.Server({ server });//webSocketServer를 만들었음 http서버 위에

const sockets= [];

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket["nickname"] = "Anonymous";
    console.log("Connected to Browser");
    socket.on("close", () => {
        console.log("Disconnected from the Browser");
    })
    socket.on("message", (msg) => {
        const message = JSON.parse(msg);
        switch(message.type){
            case "new_message":
                sockets.forEach((aSocket) => 
                    aSocket.send(`${socket.nickname}: ${message.payload}`)
                );
                break;
            case "nickname":
                socket["nickname"] = message.payload;
                break;
        }
    });
});

server.listen(3000, handleListen);