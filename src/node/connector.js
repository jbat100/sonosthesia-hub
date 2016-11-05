'use strict';

const net = require('net');

const q = require('q');
const rx = require('rx');
const EventEmitter = require('events');

const core = require('./core');

class ComponentConnector extends core.NativeEmitterClass {

    constructor() {
        this._server = null;
        this._error = null;
        this._connections = [];
        this._messageObservable = rx.Observable.fromEvent(this, 'message');
    }

    get messageObservable () { return this._messageObservable; }
    get server() { return this._server; }
    get error() { return this._error; }

    start(port) {
        return q().then(() => {
            if (this.server) return q.reject(new Error('connector is alredy started'));
            console.info(this.tag + ' start on port ' + port);
            // use a defer because we want to wait for the net server listening event before resolving the promise
            const d = q.defer();
            this._server = net.createServer((client) => {
                const connection = new ComponentConnection(this, client);
                this._connections.push(connection);
                this.emit('connection', connection);
            });
            // try reconnect on server error (usually port is taken, address in use)
            this.server.on('error', (err) => {
                console.error(this.tag + ' server error ' + err.type + ' ' + err.message);
                d.reject(err);
                this._error = err;
                this.emit('error', err);
                this.stop();
            });
            this.server.on('close', () => {
                console.error(this.tag + ' server close');
                d.reject();
                this.stop();
            });
            this.server.on('listening', () => {
                console.info(this.tag + ' server listening on port ' + port);
                d.resolve();
                this._error = null;
                this.emitter.emit('server-listening');
            });
            // actually start the server
            this.server.listen(port);
            console.info(this.tag + ' created server listening on port ' + port);
            return d.promise;
        }).catch((err) => {
            this.error = err;
            console.error(this.tag + ' could not create server on port ', port, err.message);
            this.emitter.emit('error', err);
            this.stop();
            throw err;
        });
    }

    stop() {
        return q().then(() => {
            if (this.server) {
                this.server.removeAllListeners();
                this.server.close();
                this.emitter.emit('server-stop');
            }
            this.server = null;
        });
    }

}

class ComponentConnection extends core.NativeEmitterClass {

    constructor(connector, client) {
        this._connector = connector;
        this._client = client;
    }

}
