"use strict";

function WebSocketManager(server, callbacks, context) {
    this.server = server;
    this.callbacks = callbacks;
    this.context = context;
    this.socket = new WebSocket(server);
    this.socket.onopen = this.onopen.bind(this);
}

WebSocketManager.prototype.notify = function (event, data) {
    if (typeof this.callbacks[event] === "function") {
        setTimeout(this.callbacks[event].bind(this.context, data), 0);
    }
};

WebSocketManager.prototype.onopen = function (event) {
    this.notify("setStatus", "waiting");
    this.socket.onmessage = this.receive.bind(this);
    this.socket.onclose = this.disconnect.bind(this);
}

WebSocketManager.prototype.receive = function (message) {
    var json = JSON.parse(message.data);
    this.notify(json.event, json.data);
};

WebSocketManager.prototype.disconnect = function () {
    this.notify("setStatus", "disconnected");
    if (this.socket && this.socket.readyState == 1) {
        this.socket.close();
    }
};

WebSocketManager.prototype.send = function (data) {
    this.socket.send(JSON.stringify(data));
};


function GameClient(config) {
    this.config = $.extend({ player: {}, cards: [] }, config);

    this.socketManager = new WebSocketManager(config.server, this, this);
    this.serverEvents = {
        playCard: "playCard"
    };

    $("#player-cards").on("click", ".card", this.onCardClick.bind(this));
}

GameClient.prototype.onCardClick = function (e) {
    if (this.config.currentPlayerId === this.config.player.id) {
        var card = $(e.target).attr("data-card");
        if (card.endsWith("A") || card.endsWith("10")) {
            this.showCardChoice.call(this, e, card, e.target);
            return true;
        }

        this.playCard.call(this, card, e.target);
    }
};

GameClient.prototype.showCardChoice = function (e, card, dom) {
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
    var choiceBoxA = $("<div>" + choiceA + "</div>").addClass("choice").on("click", this.playCard.bind(this, card, dom));
    var choiceBoxB = $("<div>" + choiceB + "</div>").addClass("choice").on("click", this.playCard.bind(this, card + "i", dom));
    choiceBox.append(choiceBoxA).append(choiceBoxB);
    choiceBox.css("top", e.clientY).css("left", e.clientX);
    choiceBox.appendTo(document.body);
    $(document.body).one("click", function (e) {
        choiceBox.remove();
    });

    e.stopPropagation();
};

GameClient.prototype.discardCard = function (cardElement) {
    $(cardElement).css("margin-left", $("#discard-pile").children().length * 3 + "%").appendTo("#discard-pile");
};

GameClient.prototype.playCard = function (card, dom) {
    this.socketManager.send({ event: this.serverEvents.playCard, data: card });
    this.discardCard.call(this, dom);
};

GameClient.prototype.setStatus = function (status) {
    $("#status-bar .status").removeClass().addClass("status").addClass(status);
};

GameClient.prototype.setPlayerId = function (playerId) {
    this.config.player.id = playerId;
    $(".player.main").attr("data-id", playerId);
};

GameClient.prototype.receiveCard = function (card) {
    this.config.cards.push(card);
    $("<img src=\"images/_Blank.png\"></img>").addClass("card").addClass("card-" + card).attr("data-card", card).appendTo("#player-cards");
    // make some animation
};

GameClient.prototype.gameStart = function (playerIds) {
    //TODO: fix this for generic number of players
    var otherPlayers = $(".player.remote");
    for (var i = 0; i < playerIds.length; i++) {
        if (playerIds[i] === this.config.player.id)
            break;
    }
    $(otherPlayers[0]).attr("data-id", playerIds[(i + 2) % 3]);
    $(otherPlayers[1]).attr("data-id", playerIds[(i + 1) % 3]);

    this.setStatus.call(this, "running");
};

GameClient.prototype.playerBeginTurn = function (playerId) {
    this.config.currentPlayerId = playerId;
    $(".player[data-id=" + playerId + "]").addClass("active");
};

GameClient.prototype.playerEndTurn = function (playerId) {
    this.config.currentPlayerId = null;
    $(".player[data-id=" + playerId + "]").removeClass("active");
};

GameClient.prototype.setTotal = function (total) {
    $("#card-total").text("Score: " + total);
};

GameClient.prototype.setDirection = function (direction) {
    $("#direction").removeClass().addClass(direction < 0 ? "clockwise" : "counter-clockwise");
};

GameClient.prototype.cardPlayed = function (data) {
    if (data.playerId !== this.config.player.id) {
        this.discardCard.call(this, $("<img src=\"images/_Blank.png\"></img>").addClass("card").addClass("card-" + data.card));
    }
};

GameClient.prototype.playerLost = function (playerId) {
    $(".player[data-id=" + playerId + "]").addClass("lost");
    if (playerId === this.config.player.id) {
        $(".game-over-message").removeClass("hidden").addClass("lost");
    }
};

GameClient.prototype.gameEnd = function (winnerId) {
    $(".game-over-message").removeClass("hidden").addClass(this.config.player.id == winnerId ? "won" : "lost");
};