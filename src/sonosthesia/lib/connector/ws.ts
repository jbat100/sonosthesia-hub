
import * as ws from 'ws';
import * as Q from 'q';

import {Message, MessageContentParser, IConnection} from '../core';
import {HubMessage} from "../messaging";

import {BaseConnection, BaseConnector} from './core';

//----------------------------------------------------------------------------------------------------

/**
 *
 */

export class WSConnector extends BaseConnector {

    _wsServer : any;

    start(config : any) : Q.Promise<void> {
        return super.start(config).then(() => {
            const port = config.port;
            return Q().then(() => {
                if (this._wsServer) throw new Error('connector is already started');
                console.info(this.tag + ' start on port ' + port);
                this._wsServer = new ws.Server({port:port});
                this._wsServer.on('error', (err) => {
                    this.handleError(err);
                });
                this._wsServer.on('connection', (socket) => {
                    const connection = new WSConnection(this.parser, this, socket);
                    this.registerConnection(connection);
                    socket.on('close', () => {
                        console.warn(this.tag + ' destroying connection on close');
                        this.destroyConnection(connection);
                    });
                    socket.on('error', (err) => {
                        console.warn(this.tag + ' destroying connection on error: ' + err.message);
                        this.destroyConnection(connection);
                    });
                    socket.on('disconnect', () => {
                        console.warn(this.tag + ' destroying connection on close');
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

export class WSConnection extends BaseConnection implements IConnection {

    constructor(_parser : MessageContentParser, private _connector : WSConnector, private _socket : any) {
        super(_parser);
        this._socket.on('message', (str : string) => {
            const obj = JSON.parse(str);
            try {
                this.messageSubject.next(HubMessage.newFromJSON(obj, this.parser));
            } catch (e) {
                console.error(e.message);
            }
        });
    }

    sendJSON(obj : any) {
        if (this.verbose) console.info(this.tag + ' sending message ' + obj.type);
        if (this._socket.readyState == ws.OPEN) {
            this._socket.send(JSON.stringify(obj)); // emit message event
        } else {
            console.warn(this.tag + ' cannot send, socket is not opened');
        }

    }

    sendMessage(message : Message) {
        this.sendJSON(message.toJSON());
    }

}
