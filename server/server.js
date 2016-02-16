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
        var json = JSON.parse(message);
        if (ws.game) {
            ws.game.onClientMessage(ws.id, json.event, json.data);
        }
    });

    // on disconnect
    ws.on("close", function () {
        // remove player from queue if there
        players = players.filter(player => player.id != ws.id);
        
        // ... or remove him from any running games
        if (ws.game) {
            ws.game.observer.removeSubscriber(ws);
            ws.game.playerLost(ws.id);
        }
    });
    
    // send the player id to client
    ws.send(JSON.stringify({
        event: "setPlayerId",
        data: ws.id
    }));
    
    // start the game if there are enough players
    if (players.length >= 3) {
        var gamePlayers = players.splice(0, 3);
        var game = new Game(gamePlayers.map(player => player.id), new Observer(gamePlayers, game));

        gamePlayers.forEach(function (gamePlayer) {
            // set game object to each player
            gamePlayer.game = game;
        });
    }
});

console.log("Listening on port " + port);