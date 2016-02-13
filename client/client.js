// game client class
function GameClient(config) {
    "use strict";
    
    var self = this;
    this.config = $.extend({}, config);
    this.eventHandlers = {
        gameStart: function (otherPlayerIds) {
            
        },
        
        playerBeginTurn: function (playerId) {
            
        },
        
        playerEndTurn: function (playerId) {
            
        },
        
        setTotal: function (total) {
            
        },
        
        setDirection: function (direction) {
            
        },
        
        receiveCard: function (card) {
            
        },
        
        gameEnd: function (winnerId) {
            $(".game-over-message").removeClass("hidden").addClass(this.config.player.id == winnerId ? "won" : "lost");
        }
    };

    this.connect = function (server) {
        self.socket = new WebSocket(server);
        self.socket.onopen = function (event) {
            $("#connection-status").text("Conencted").removeClass("connecting").addClass("connected");
            self.socket.onmessage = self.receive;
            self.socket.onclose = self.disconnect;
        };
    };

    this.receive = function (message) {
        var json = JSON.parse(message.data);
        self.eventHandlers[json.event].call(self, json.data);
    };

    this.send = function (data) {
        self.socket.send(JSON.stringify(data));
    };

    this.disconnect = function () {
        $("#connection-status").text("Disconnected").removeClass("connecting connected").addClass("disconnected");
        if (self.socket && self.socket.readyState == 1) {
            self.socket.close();
        }
    };

    this.connect(this.config.server);
}