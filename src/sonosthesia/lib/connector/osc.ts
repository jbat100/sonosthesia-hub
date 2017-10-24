

import * as Q from 'q';
import * as dgram from 'dgram';

import {Message, MessageContentParser, IConnection} from '../core';
import {HubMessage} from "../messaging";

import {BaseConnection, BaseConnector} from './core';

const osc = require('osc-min');

//----------------------------------------------------------------------------------------------------

/**
 * UDP OSC (juce uses UDP so sticking to that...)
 */

export class OSCConnector extends BaseConnector {

    _socket : any;

    start(config : any) : Q.Promise<void> {

        return super.start(config).then(() => {
            const port = config.port;
            return Q().then(() => {
                this._socket = dgram.createSocket("udp4", (msg, rinfo) => {
                    // TODO: create/get connection based on rinfo
                    try {
                        const obj = osc.fromBuffer(msg);
                    } catch (err) {
                        console.error(this.tag + ' message error : ' + err.message)
                    }
                });
                this._socket.bind(port);
            }).catch((err) => {
                console.error(this.tag + ' could not create server on port ', port, err.message);
                this.handleError(err);
                this.stop().then(() => { throw err; });
            });
        });
    }

}

export class OSCConnection extends BaseConnection implements IConnection {

    constructor(_parser : MessageContentParser, private _connector : OSCConnector, private _socket : any) {
        super(_parser);
    }

    sendJSON(obj : any) {
    }

    sendMessage(message : Message) {
    }

}
