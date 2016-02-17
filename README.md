This is a simple implementation of the [Ninety-nine](https://en.wikipedia.org/wiki/Ninety-nine_%28addition_card_game%29) card game.

It consists of a server on nodejs and static client html that communicate through web sockets. The card game logic is located on the server, the client just processes all the events and renders them appropriately. It currently supports multiplayer with 3 players.

This projects includes the [ws](https://github.com/websockets/ws) nodejs module that provides a thin wrapper for working with web sockets. It is used instead of [socket.io](http://socket.io/) because of issues with [CORS](https://en.wikipedia.org/wiki/Cross-origin_resource_sharing). It seemed redundant to me to deal with cross-origin issues despite the fact that web sockets are not bound by such rules. That's why I decided to go with the ws module which has less features.

It also includes [jquery](https://jquery.com/) in the client side for manipulating DOM elements more easily. Note that the web page contains some experimental [CSS features](https://www.w3.org/TR/css3-transforms/) at the time of writing.
