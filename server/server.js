var WebSocketServer = require('ws').Server
    , wss = new WebSocketServer({ port: 8080 });

var players = [];
var idcount = 1;

function receive(socket, message) {
    console.log("received: %s", message);
}

wss.on("connection", function connection(ws) {
    var playerId = idcount++;
    
    ws.on("message", function(message) {
        receive(ws, message);
    });
    
    ws.on("close", function() {
       
    });
    
    // send the player id to client
    ws.send(JSON.stringify({
        event: "set",
        data: {
            player: {
                id: playerId
            }
        }
    }));
});

/*var io = require("socket.io")(),
    cors = require('cors');
io.listen(8080);

var players = [];
var idcount = 1;

function receive(socket, message) {
    console.log("received: %s", message);
}

io.on("connection", function (socket) {
    var playerId = idcount++;
    
    socket.on("message", function(message) {
        receive(socket, message);
    });
    
    socket.on("close", function() {
       
    });
    
    // send the player id to client
    socket.send(JSON.stringify({
        event: "set",
        data: {
            player: {
                id: playerId
            }
        }
    }));
});*/