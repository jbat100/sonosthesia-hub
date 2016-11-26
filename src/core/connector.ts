
import * as net from 'net';

import * as _ from 'underscore';
import * as Q from 'q';
import * as Rx from 'rx';

const LineInputStream = require('line-input-stream');

import {NativeClass} from './core';

class ComponentConnector extends NativeClass {

    constructor() {
        this._server = null;
        this._error = null;
        this._jsonDelimiter = '__json_delimiter__';
        this._connections = [];
        this._messageObservable = Rx.Observable.fromEvent(this, 'message');
    }

    get messageObservable () { return this._messageObservable; }
    get server() { return this._server; }
    get error() { return this._error; }
    get jsonDeleimiter() { return this._jsonDelimiter; }

    start(port) {
        return q().then(() => {
            if (this.server) return q.reject(new Error('connector is alredy started'));
            console.info(this.tag + ' start on port ' + port);
            // use a defer because we want to wait for the net server listening event before resolving the promise
            const d = q.defer();
            this._server = net.createServer((socket) => {
                const connection = new ComponentConnection(this, socket);
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
                this.emit('start');
            });
            // actually start the server
            this.server.listen(port);
            console.info(this.tag + ' created server listening on port ' + port);
            return d.promise;
        }).catch((err) => {
            this.error = err;
            console.error(this.tag + ' could not create server on port ', port, err.message);
            this.emit('error', err);
            this.stop();
            throw err;
        });
    }

    stop() {
        return q().then(() => {
            if (this.server) {
                this.server.removeAllListeners();
                this.server.close();
                this.emit('stop');
            }
            this.server = null;
        });
    }

    destroyConnection(connection) {
        console.warn(this.tag + ' destroying connection!');
        this.connections = _.without(this.connections, connection);
        this.emitter.emit('disconnection', connection);
    }

}

class ComponentConnection extends NativeEmitterClass {

    constructor(connector, socket) {
        super();
        expect(connector).to.be.instanceof(ComponentConnector);
        this._connector = connector;
        this._socket = socket;
        this._info = {};
        console.info(this.tag + ' initialize with socket : ' + socket.remoteAddress +':'+ socket.remotePort);

        // destroy connection on socket close or error
        socket.on('close', () => {
            console.info(this.tag + ' socket closed');
            this.connector.destroyConnection(this);
        });
        // we NEED the error handler, otherwise it bubbles up and causes the server to crash
        socket.on('error', (err) => {
            console.error(this.tag + ' socket error' + err.type + ' ' + err.message);
            this.connector.destroyConnection(this);
        });

        // setup a line input stream with the json delimiter and parse json objects
        this.lineInputStream = LineInputStream(socket);
        this.lineInputStream.setEncoding('utf8');
        this.lineInputStream.setDelimiter(this.connector.jsonDelimiter);
        this.lineInputStream.on('line', (line) => {
            if (line && line.length) {
                if (this.connector.verbose) console.info(this.tag + ' line : ' + line);
                let obj = null;
                try {
                    obj = JSON.parse(line);
                    //console.info(this.tag + ' parsed json');
                } catch (err) {
                    console.error(this.tag + ' json parsing error : ' + err.message);
                }
                if (obj) {
                    this.emit('message', obj);
                }
            } else {
                if (this.connector.verbose) console.info(this.tag + ' empty line');
            }
        });
        this.lineInputStream.on('error', err => {
            console.error(this.tag + ' line input stream error event : ' + err.message);
        });

    }

    sendMessage(message) {
        const str = this.connector.tcpJsonDelimiter + JSON.stringify(message) + this.connector.tcpJsonDelimiter;
        if (this.connector.verbose) console.info(this.tag + ' sending : ' + str);
        this.socket.write(str);
    }

}
