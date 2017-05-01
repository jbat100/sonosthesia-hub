/**
 * Created by jonathan on 01/05/2017.
 */

//

import * as _ from 'underscore';
import * as Q from 'q';
import * as Rx from 'rxjs/Rx';
import {EventEmitter} from 'eventemitter3';

import {NativeClass, Message, MessageContentParser, IConnection, GUID} from '../core';

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
        console.error(this.tag + ' handle error : ' + err.message);
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
