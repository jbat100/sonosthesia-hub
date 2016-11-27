
//

import * as net from 'net';
import * as _ from 'underscore';
import * as Q from 'q';
import * as Rx from 'rx';
import {EventEmitter} from 'eventemitter3';

import {NativeClass, Message} from '../core/core';
import {IConnection} from "../core/interface";

const LineInputStream = require('line-input-stream');


class TCPConnector extends NativeClass {

    readonly jsonDelimiter = '__json_delimiter__';
    readonly verbose = true;
    private _error : Error;
    private _server : net.Server;
    private _connections : TCPConnection[] = [];
    private _emitter : any = new EventEmitter();

    get server() { return this._server; }
    get error() { return this._error; }
    get emitter() { return this._emitter; }

    start(port) {
        return new Q.Promise((resolve, reject) => {
            if (this.server) return reject(new Error('connector is alredy started'));
            console.info(this.tag + ' start on port ' + port);
            this._server = net.createServer((socket) => {
                const connection = new TCPConnection(this, socket);
                this._connections.push(connection);
                this.emitter.emit('connection', connection);
            });
            // try reconnect on server error (usually port is taken, address in use)
            this.server.on('error', (err : any) => {
                console.error(this.tag + ' server error ' + err.type + ' ' + err.message);
                reject(err);
                this._error = err;
                this.emitter.emit('error', err);
                this.stop();
            });
            this.server.on('close', () => {
                console.error(this.tag + ' server close');
                reject();
                this.stop();
            });
            this.server.on('listening', () => {
                console.info(this.tag + ' server listening on port ' + port);
                resolve();
                this._error = null;
                this.emitter.emit('start');
            });
            // actually start the server
            this.server.listen(port);
            console.info(this.tag + ' created server listening on port ' + port);
        }).catch((err) => {
            this._error = err;
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
                this._server = null;
                this.emitter.emit('stop');
            }
        });
    }

    destroyConnection(connection) {
        console.warn(this.tag + ' destroying connection!');
        this._connections = _.without(this._connections, connection);
        this.emitter.emit('disconnection', connection);
    }

}

class TCPConnection extends NativeClass implements IConnection {

    private _lineInputStream : any;

    private _messageSubject : Rx.Subject<Message> = new Rx.Subject<Message>();
    private _messageObservable: Rx.Observable<Message> = this._messageSubject.asObservable();

    constructor(private _connector : TCPConnector, private _socket : net.Socket) {
        super();
        console.info(this.tag + ' initialize with socket : ' + this.socket.remoteAddress +':'+ this.socket.remotePort);
        // destroy connection on socket close or error
        this.socket.on('close', () => {
            console.info(this.tag + ' socket closed');
            this.connector.destroyConnection(this);
        });
        // we NEED the error handler, otherwise it bubbles up and causes the server to crash
        this.socket.on('error', (err : any) => {
            console.error(this.tag + ' socket error' + err.type + ' ' + err.message);
            this.connector.destroyConnection(this);
        });

        // setup a line input stream with the json delimiter and parse json objects
        this._lineInputStream = LineInputStream(this.socket);
        this._lineInputStream.setEncoding('utf8');
        this._lineInputStream.setDelimiter(this.connector.jsonDelimiter);
        this._lineInputStream.on('line', (line : any) => {
            if (line && line.length) {
                try {
                    //console.info(this.tag + ' parsed json');
                    this._messageSubject.onNext(Message.newFromRaw(line));
                } catch (err) {
                    console.error(this.tag + ' json parsing error : ' + err.message);
                }
            }
        });
        this._lineInputStream.on('error', err => {
            console.error(this.tag + ' line input stream error event : ' + err.message);
        });

    }

    get messageObservable() : Rx.Observable<Message> { return this._messageObservable; }

    get socket() : net.Socket { return this._socket; }

    get connector() : TCPConnector { return this._connector; }

    sendMessage(message) {
        const str = this.connector.jsonDelimiter + JSON.stringify(message) + this.connector.jsonDelimiter;
        if (this.connector.verbose) console.info(this.tag + ' sending : ' + str);
        this.socket.write(str);
    }

}
