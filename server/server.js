"use strict";

var WebSocketServer = require("ws").Server,
    port = 8080,
    wss = new WebSocketServer({ port: port }),
    Game = require("./game.js"),
    Observer = require("./observer.js");

var players = [];
var idcount = 1;

wss.on("connection", function connection(ws) {
    ws.id = idcount++;
    players.push(ws);

    // on message received send it to the game
    ws.on("message", function (message) {
        console.log("Received: " + message);
        var json = JSON.parse(message);
        if (ws.game) {
            ws.game.onClientMessage(ws.id, json.event, json.data);
        }
    });

    // on disconnect
    ws.on("close", function () {
        // remove player from queue if there
        for (let i = 0; i < players.length; i++) {
            if (players[i].id == ws.id) {
                players.splice(i, 1);
            }
        }
        
        // ... or remove him from any running games
        if (ws.game) {
            ws.game.playerLost(ws.id);
        }
    });
    
    // send the player id to client
    ws.send(JSON.stringify({
        event: "setPlayerId",
        data: ws.id.toString()
    }));
    
    // start the game if there are enough players
    if (players.length == 3) {
        var gamePlayers = players.splice(0, 3);
        var game = new Game(gamePlayers, new Observer(gamePlayers, game));

        gamePlayers.forEach(function (gamePlayer) {
            // set game object to each player
            gamePlayer.game = game;
        });
    }
});

console.log("Listening on port " + port);