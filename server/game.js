"use strict";

// Card helper class
function Card(suite, value) {
    this.suite = suite;
    this.value = value;
}

Card.parse = function (card) {
    var cardParts = card.split("-");
    return new Card(cardParts[0], cardParts[1]);
}

Card.prototype.toString = function () {
    return this.suite + "-" + this.value;
};

// Keeps the game state
function GameState(players) {
    this.total = 0;
    this.players = players;
    this.currentPlayerId = 0;
    this.direction = 1;

    // generate a deck of 52 cards
    var generateDeck = function () {
        var cardSuites = ["clubs", "hearts", "spades", "diamonds"];
        var cardValues = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        var deck = new Array(52);

        var cnt = 0;
        for (let i = 0; i < cardSuites.length; i++) {
            for (let j = 0; j < cardValues.length; j++) {
                deck[cnt++] = new Card(cardSuites[i], cardValues[j]);
            }
        }

        return deck;
    };
    
    // Fisher–Yates shuffle
    var shuffleDeck = function (deck) {
        for (var i = deck.length - 1; i >= 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = deck[i];
            deck[i] = deck[j];
            deck[j] = tmp;
        }
    };

    this.deck = generateDeck();
    shuffleDeck(this.deck);
}

// get top card from deck and remove it
GameState.prototype.drawCard = function () {
    if (this.deck.length > 0) {
        return this.deck.pop();
    }

    return "";
};

// advance to the next player
GameState.prototype.advancePlayers = function () {
    this.currentPlayerId += this.direction;
    if (this.currentPlayerId < 0) {
        this.currentPlayerId += this.players.length;
    }
    else if (this.currentPlayerId >= this.players.length) {
        this.currentPlayerId -= this.players.length
    }
};

// remove a player that has lost
GameState.prototype.removePlayer = function (player) {
    var index = this.players.indexOf(player);
    if (index >= 0) {
        if (this.currentPlayerId >= index) {
            this.currentPlayerId--;
        }

        this.players.splice(index, 1);
        if (this.currentPlayerId < 0) {
            this.currentPlayerId += this.players.length;
        }
    }
};

function Game(players, observer) {
    this.observer = observer;
    this.gameState = new GameState(players);

    // list of client events
    this.clientEvents = {
        gameStart: "gameStart",
        playerBeginTurn: "playerBeginTurn",
        playerEndTurn: "playerEndTurn",
        setTotal: "setTotal",
        setDirection: "setDirection",
        receiveCard: "receiveCard",
        cardPlayed: "cardPlayed",
        playerLost: "playerLost",
        gameEnd: "gameEnd",
    };

    // deal 3 cards to each player
    players.forEach(function (player) {
        for (let i = 0; i < 3; i++) {
            let card = this.gameState.drawCard();
            this.observer.notify(player, this.clientEvents.receiveCard, card.toString());
        }
    }, this);

    // start game and begin first turn
    this.observer.notifyAll(this.clientEvents.gameStart, players);
    this.observer.notifyAll(this.clientEvents.playerBeginTurn, this.gameState.players[this.gameState.currentPlayerId]);
}

// The game engine
Game.prototype.playCard = function (player, cardString) {
    var card = Card.parse(cardString);
    var total = this.gameState.total;

    switch (card.value) {
        case "3": // skip next player
            total += 3;
            this.gameState.advancePlayers();
            break;
        case "4": // reverse direction of play
            this.gameState.direction *= -1;
            this.observer.notifyAll(this.clientEvents.setDirection, this.gameState.direction);
            break;
        case "10i": // inverse 10
            total -= 10;
            break;
        case "A":
            total += 1;
            break;
        case "Ai": // alternative A
            total += 11;
            break;
        case "K": // bump total to 99
            total = 99;
            break;
        case "J":
        case "Q":
            total += 10;
            break;
        case "9": // pass
            break;
        default:
            total += parseInt(card.value);
    }

    if (total > 99) {
        // player lost
        this.playerLost(player);
    }
    else {
        // set new total
        this.gameState.total = total;
        this.observer.notifyAll(this.clientEvents.cardPlayed, { playerId: player, card: cardString });
        this.observer.notifyAll(this.clientEvents.setTotal, total);
        // draw card
        this.observer.notify(player, this.clientEvents.receiveCard, this.gameState.drawCard().toString());
    }

    // end player turn and begin next
    this.observer.notifyAll(this.clientEvents.playerEndTurn, player);
    this.gameState.advancePlayers();
    this.observer.notifyAll(this.clientEvents.playerBeginTurn, this.gameState.players[this.gameState.currentPlayerId]);
};

// player lost
Game.prototype.playerLost = function (player) {
    this.observer.notifyAll(this.clientEvents.playerLost, player);
    this.gameState.removePlayer(player);
        
    // game end
    if (this.gameState.players.length < 2 && this.gameState.players.length > 0) {
        this.observer.notifyAll(this.clientEvents.gameEnd, this.gameState.players[0]);
        return;
    }
};

// process messages from the client
Game.prototype.onClientMessage = function (player, event, data) {
    if (event == "playCard") {
        this.playCard(player, data);
    }
};

module.exports = Game;