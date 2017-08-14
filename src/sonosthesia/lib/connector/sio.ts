


import * as http from 'http';
import * as sio from 'socket.io';
import * as Q from 'q';

import {Message, MessageContentParser, IConnection} from '../core';
import {HubMessage} from "../messaging";

import {BaseConnection, BaseConnector} from './core';

//----------------------------------------------------------------------------------------------------

/**
 *
 */

export class SIOConnector extends BaseConnector {

    _httpServer : http.Server;
    _sioServer : any; // can't seem to find a socket.io Server type in the type definition file

    start(port : number) : Q.Promise<void> {
        return super.start(port).then(() => {
            return Q().then(() => {
                if (this._sioServer) throw new Error('connector is already started');
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
