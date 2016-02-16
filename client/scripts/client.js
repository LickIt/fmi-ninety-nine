"use strict";

// game client class
function GameClient(config) {
    var self = this;
    this.config = $.extend({ player: {}, cards: [] }, config);

    this.eventHandlers = {
        setPlayerId: function (playerId) {
            this.config.player.id = playerId;
            $(".player.main").attr("data-id", playerId);
        },

        receiveCard: function (card) {
            this.config.cards.push(card);
            $("<img src=\"images/_Blank.png\"></img>").addClass("card").addClass("card-" + card).attr("data-card", card).appendTo("#player-cards");
            // make some animation
        },

        gameStart: function (playerIds) {
            //TODO: fix this for generic number of players
            var otherPlayers = $(".player.remote");
            for (var i = 0; i < playerIds.length; i++) {
                if (playerIds[i] === this.config.player.id)
                    break;
            }
            $(otherPlayers[0]).attr("data-id", playerIds[(i + 2) % 3]);
            $(otherPlayers[1]).attr("data-id", playerIds[(i + 1) % 3]);

            this.setStatus("running");
        },

        playerBeginTurn: function (playerId) {
            this.config.currentPlayerId = playerId;
            $(".player[data-id=" + playerId + "]").addClass("active");
        },

        playerEndTurn: function (playerId) {
            this.config.currentPlayerId = null;
            $(".player[data-id=" + playerId + "]").removeClass("active");
        },

        setTotal: function (total) {
            $("#card-total").text("Score: " + total);
        },

        setDirection: function (direction) {
            $("#direction").removeClass().addClass(direction < 0 ? "clockwise" : "counterclockwise");
        },

        cardPlayed: function (data) {
            if (data.playerId !== this.config.player.id) {
                this.discardCard($("<img src=\"images/_Blank.png\"></img>").addClass("card").addClass("card-" + data.card));
            }
        },

        playerLost: function (playerId) {
            $(".player[data-id=" + playerId + "]").addClass("lost");
            if (playerId === this.config.player.id) {
                $(".game-over-message").removeClass("hidden").addClass("lost");
            }
        },

        gameEnd: function (winnerId) {
            $(".game-over-message").removeClass("hidden").addClass(this.config.player.id == winnerId ? "won" : "lost");
        }
    };

    var serverEvents = {
        playCard: "playCard"
    };

    function init() {
        self.connect(self.config.server);
        $("#player-cards").on("click", ".card", self.onCardClick);
    }

    /* Events */
    this.onCardClick = function (e) {
        if (self.config.currentPlayerId === self.config.player.id) {
            var card = $(this).attr("data-card");
            if (card.endsWith("A") || card.endsWith("10")) {
                self.showCardChoice(e, card, this);
                return true;
            }

            self.playCard(card, this);
        }
    };

    this.showCardChoice = function (e, card, dom) {
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
        var choiceBoxA = $("<div>" + choiceA + "</div>").addClass("choice").on("click", self.playCard.bind(self, card, dom));
        var choiceBoxB = $("<div>" + choiceB + "</div>").addClass("choice").on("click", self.playCard.bind(self, card + "i", dom));
        choiceBox.append(choiceBoxA).append(choiceBoxB);
        choiceBox.css("top", e.clientY).css("left", e.clientX);
        choiceBox.appendTo(document.body);
        $(document.body).one("click", function (e) {
            choiceBox.remove();
        });

        e.stopPropagation();
    }

    this.discardCard = function (cardElement) {
        $(cardElement).css("margin-left", $("#discard-pile").children().length * 3 + "%").appendTo("#discard-pile");
    };

    this.playCard = function (card, dom) {
        self.send({ event: serverEvents.playCard, data: card });
        self.discardCard(dom);
    };

    /* Web Sockets */
    this.connect = function (server) {
        self.socket = new WebSocket(server);
        self.socket.onopen = function (event) {
            self.setStatus("waiting");
            self.socket.onmessage = self.receive;
            self.socket.onclose = self.disconnect;
        };
    };

    this.receive = function (message) {
        console.log(message.data);
        var json = JSON.parse(message.data);
        if (typeof self.eventHandlers[json.event] === "function") {
            setTimeout(self.eventHandlers[json.event].bind(self, json.data), 0);
        }
    };

    this.send = function (data) {
        self.socket.send(JSON.stringify(data));
    };

    this.disconnect = function () {
        self.setStatus("disconnected");
        if (self.socket && self.socket.readyState == 1) {
            self.socket.close();
        }
    };

    this.setStatus = function (status) {
        $("#status-bar .status").removeClass().addClass("status").addClass(status);
    };

    init();
}