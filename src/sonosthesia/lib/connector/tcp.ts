/**
 * Created by jonathan on 01/05/2017.
 */

import * as net from 'net';
import * as Q from 'q';

import {Message, MessageContentParser, IConnection} from '../core';
import {HubMessage} from "../messaging";

import {BaseConnection, BaseConnector} from './core';

const LineInputStream = require('line-input-stream');

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
            //console.log(this.tag + ' start on port: ' + port);
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

    constructor(_parser : MessageContentParser,
                private _connector : TCPConnector,
                private _socket : net.Socket) {

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