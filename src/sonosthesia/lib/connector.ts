
//

import * as net from 'net';
import * as http from 'http';
import * as sio from 'socket.io';
import * as _ from 'underscore';
import * as Q from 'q';
import * as Rx from 'rxjs/Rx';
import {EventEmitter} from 'eventemitter3';

import {NativeClass, Message, MessageContentParser, IConnection, GUID} from './core';
import {HubMessage} from "./messaging";

const LineInputStream = require('line-input-stream');


// simple loop-back connection, send a message and it receives it
export class BaseConnection extends NativeClass {

    readonly verbose = true;

    private _messageSubject : Rx.Subject<Message> = new Rx.Subject<Message>();
    private _messageObservable: Rx.Observable<Message> = this._messageSubject.asObservable();

    private _identifier : string;

    constructor(private _parser : MessageContentParser) {
        super();
        this._identifier = GUID.generate();
    }

    get tag() : string { return this.constructor.name + ' (' + this.identifier.substr(0, 10) + '...)'; }
    get identifier() : string { return this._identifier; }
    get connectionType() : string { return 'base'; }
    get messageObservable() : Rx.Observable<Message> { return this._messageObservable; }
    get parser() : MessageContentParser { return this._parser; }

    protected get messageSubject() : Rx.Subject<Message> { return this._messageSubject; }

}


export class BaseConnector extends NativeClass {

    readonly verbose = true;
    private _error : Error;
    private _connections : BaseConnection[] = [];
    private _emitter : any = new EventEmitter();

    constructor(private _parser : MessageContentParser)
    {
        super();
    }

    get error() { return this._error; }
    get emitter() { return this._emitter; }
    get parser() { return this._parser; }

    start(port : number) : Q.Promise<void> {
        return Q();
    }

    stop() : Q.Promise<void> {
        return Q().then(() => {
            this.resetError();
        });
    }

    // needs to be public so that it can be called by the connection
    destroyConnection(connection : BaseConnection) {
        console.warn(this.tag + ' destroying connection!');
        this._connections = _.without(this._connections, connection);
        this.emitter.emit('disconnection', connection);
    }

    protected registerConnection(connection : BaseConnection) {
        this._connections.push(connection);
        this.emitter.emit('connection', connection);
    }

    protected handleError(err : Error) {
        this._error = err;
        this.emitter.emit('error', err);
    }

    protected resetError() {
        this._error = null;
    }
}




//----------------------------------------------------------------------------------------------------

// simple loop-back connection, send a message and it receives it
export class LocalConnection extends BaseConnection implements IConnection {

    private _loopback = false;
    private _verbose = false;

    get connectionType() : string { return 'local'; }

    get loopback() : boolean { return this._loopback; }

    set loopback(val : boolean) { this._loopback = val; }

    sendMessage(message : Message) {
        //console.log(this.tag + ' sending message of type : ' + message.type);
        if (this.loopback) this.messageSubject.next(message);
    }

}

//----------------------------------------------------------------------------------------------------

/**
 * TCPConnector runs server side and spawns TCPConnection instances upon incoming socket connections
 * Uses raw tcp socket with delimiters seperating stringified JSON objects
 */

export class TCPConnector extends BaseConnector {

    private _server : net.Server;

    get server() { return this._server; }

    start(port : number) : Q.Promise<void> {
        return super.start(port).then(() => {
            return Q.Promise((resolve, reject) => {
                if (this.server) return reject(new Error('connector is already started'));
                console.info(this.tag + ' start on port ' + port);
                this._server = net.createServer((socket) => {
                    this.registerConnection(new TCPConnection(this.parser, this, socket));
                });
                // try reconnect on server error (usually port is taken, address in use)
                this.server.on('error', (err : any) => {
                    console.error(this.tag + ' server error ' + err.type + ' ' + err.message);
                    reject(err);
                    this.handleError(err);
                    this.stop();
                });
                this.server.on('close', () => {
                    console.error(this.tag + ' server close');
                    reject(new Error('closed'));
                    this.stop();
                });
                this.server.on('listening', () => {
                    console.info(this.tag + ' server listening on port ' + port);
                    resolve(null);
                    this.resetError();
                    this.emitter.emit('start');
                });
                // actually start the server
                this.server.listen(port);
                console.info(this.tag + ' created server listening on port ' + port);
            }).catch((err) => {
                console.error(this.tag + ' could not create server on port ', port, err.message);
                this.handleError(err);
                this.stop().then(() => {
                    throw err;
                });
            });
        });
    }

    stop() : Q.Promise<void> {
        return super.stop().then(() => {
            this.resetError();
            if (this.server) {
                this.server.removeAllListeners();
                this.server.close();
                this._server = null;
                this.emitter.emit('stop');
            }
        });
    }

}

/**
 * TCPConnection can be used both with an associated connector (when running as server) and without
 * (when running as a client)
 */


export class TCPConnection extends BaseConnection implements IConnection {

    private _lineInputStream : any;

    constructor(_parser : MessageContentParser, private _connector : TCPConnector, private _socket : net.Socket) {
        super(_parser);

        console.info(this.tag + ' initializing : ' + this.socket.remoteAddress +':'+ this.socket.remotePort);

        // destroy connection on socket close or error
        this.socket.on('close', () => {
            console.info(this.tag + ' socket closed');
            if (this.connector) this.connector.destroyConnection(this);
        });
        // we NEED the error handler, otherwise it bubbles up and causes the server to crash
        this.socket.on('error', (err : any) => {
            console.error(this.tag + ' socket error ' + err.type + ' ' + err.message);
            if (this.connector) this.connector.destroyConnection(this);
        });

        // setup a line input stream with the json delimiter and parse json objects
        this._lineInputStream = LineInputStream(this.socket);
        this._lineInputStream.setEncoding('utf8');
        this._lineInputStream.setDelimiter(this.jsonDelimiter);
        this._lineInputStream.on('line', (line : any) => {
            if (line && line.length) {
                try {
                    //console.info(this.tag + ' parsed json');
                    const obj = JSON.parse(line);
                    this.messageSubject.next(HubMessage.newFromJSON(obj, this.parser));
                } catch (err) {
                    console.error(this.tag + ' json parsing error : ' + err.stack);
                }
            }
        });
        this._lineInputStream.on('error', err => {
            console.error(this.tag + ' line input stream error : ' + err.message);
        });

    }

    get jsonDelimiter() : string { return '__json_delimiter__'; }
    get connectionType() : string { return 'tcp'; }
    get socket() : net.Socket { return this._socket; }
    get connector() : TCPConnector { return this._connector; }

    sendJSON(obj : any) {
        const str = this.jsonDelimiter + JSON.stringify(obj) + this.jsonDelimiter;
        if (this.verbose) console.info(this.tag + ' sending : ' + str);
        this.socket.write(str);
    }

    sendMessage(message : Message) {
        this.sendJSON(message.toJSON());
    }

}


//----------------------------------------------------------------------------------------------------

/**
 * TCPConnector runs server side and spawns TCPConnection instances upon incoming socket connections
 * Uses raw tcp socket with delimiters seperating stringified JSON objects
 */

export class SIOConnector extends BaseConnector {

    _httpServer : http.Server;
    _sioServer : any; // can't seem to find a socket.io Server type in the type definition file

    start(port : number) : Q.Promise<void> {
        return super.start(port).then(() => {
            return Q.Promise((resolve, reject) => {
                if (this._sioServer) return reject(new Error('connector is already started'));
                console.info(this.tag + ' start on port ' + port);
                this._httpServer = http.createServer((req, res) => {
                    console.log(this.tag + ' incoming http request');
                });
                this._httpServer.listen(port);
                this._sioServer = sio(this._httpServer);
                this._sioServer.on('connection', (socket) => {
                    const connection = new SIOConnection(this.parser, this, socket);
                    this.registerConnection(connection);
                    socket.on('disconnect', () => {
                        this.destroyConnection(connection);
                    });
                });
                console.info(this.tag + ' created server listening on port ' + port);
            }).catch((err) => {
                console.error(this.tag + ' could not create server on port ', port, err.message);
                this.handleError(err);
                this.stop().then(() => {
                    throw err;
                });
            });
        });
    }

}

export class SIOConnection extends BaseConnection implements IConnection {

    constructor(_parser : MessageContentParser, private _connector : SIOConnector, private _socket : any) {
        super(_parser);
        this._socket.on('message', (obj : any) => {
            this.messageSubject.next(HubMessage.newFromJSON(obj, this.parser));
        });
    }

    sendJSON(obj : any) {
        if (this.verbose) console.info(this.tag + ' sending message ' + obj.type);
        this._socket.send(obj); // emit message event
    }

    sendMessage(message : Message) {
        this.sendJSON(message.toJSON());
    }

}
