"use strict";

function Observer(subscribers, idSelector) {
    this.subscribers = subscribers;
    if (typeof idSelector !== "function") {
        this.id = subscriber => subscriber.id;
    }
    else {
        this.id = idSelector;
    }
}

Observer.prototype.removeSubscriber = function (subscriber) {
    this.subscribers = this.subscribers.filter(sub => this.id(sub) !== this.id(subscriber));
};

Observer.prototype.notify = function (subscriberId, event, data) {
    var subscriber = this.subscribers.find(sub => this.id(sub) === subscriberId, this);
    if (subscriber) {
        subscriber.send(JSON.stringify({ event, data }), function (error) {
            if (error) {
                console.error(error);
            }
        });
    }
};

Observer.prototype.notifyAll = function (event, data) {
    this.subscribers.forEach(function (subscriber) {
        subscriber.send(JSON.stringify({ event, data }), function (error) {
            if (error) {
                console.error(error);
            }
        });
    }, this);
};

module.exports = Observer;