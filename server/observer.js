"use strict";

function Observer(players, game) {
    this.players = players;
    this.game = game;
}

Observer.prototype.notify = function (playerId, event, data) {
    this.players.forEach(function (player) {
        if (player.id == playerId) {
            player.send(JSON.stringify({ event, data }));
        }
    }, this);
};

Observer.prototype.notifyAll = function (event, data) {
    this.players.forEach(function (player) {
        this.notify(player, event, data);
    }, this);
};

module.export = Observer;