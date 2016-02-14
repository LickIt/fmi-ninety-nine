// game client class
function GameClient(config) {
    "use strict";
    
    var self = this;
    this.config = $.extend({}, config);
    this.eventHandlers = {
        setPlayerId: function (playerId) {
            
        },
        
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
        
        playerLost: function (playerId) {
            
        },
        
        gameEnd: function (winnerId) {
            $(".game-over-message").removeClass("hidden").addClass(this.config.player.id == winnerId ? "won" : "lost");
        }
    };
    
    var serverEvents = {
        playCards: "playCards"
    };

    function init() {
        self.connect(self.config.server);
        $("#player-cards").on("click", ".card", self.onCardClick);
    }

    /* Events */
    this.onCardClick = function (e) {
        var card = $(this).attr("data-card");
        if (card.endsWith("A") || card.endsWith("10")) {
            self.showCardChoice(e, card);
            return true;
        }
        
        self.playCard(card);
    };

    this.showCardChoice = function (e, card) {
        var choiceA, choiceB;
        
        if (card.endsWith("A")) {
            choiceA = "1";
            choiceB = "11";
        }
        else if (card.endsWith("10")) {
            choiceA = "10";
            choiceB = "-10";
        }
        
        var choiceBox = $("<div></div>").addClass("card-choice-box");
        var choiceBoxA = $("<div>" + choiceA + "</div>").addClass("choice").on("click", self.playCard.bind(self, card));
        var choiceBoxB = $("<div>" + choiceB + "</div>").addClass("choice").on("click", self.playCard.bind(self, card + "i"));
        choiceBox.append(choiceBoxA).append(choiceBoxB);
        choiceBox.css("top", e.clientY).css("left", e.clientX);
        choiceBox.appendTo(document.body);
        $(document.body).one("click", function (e) {
            choiceBox.remove();
        });
        
        e.stopPropagation();
    }
    
    this.playCard = function (card) {
        console.log(card);
        self.send({event: serverEvents.playCards, data: card });
    };

    /* Web Sockets */
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
        if (typeof self.eventHandlers[json.event] === "function") {
            self.eventHandlers[json.event].call(self, json.data);
        }
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

    init();
    //this.connect(this.config.server);
}