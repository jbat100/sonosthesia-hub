/**
 * Created by jonathan on 01/05/2017.
 */

//

import * as _ from 'underscore';
import * as Q from 'q';
import * as Rx from 'rxjs/Rx';
import {EventEmitter} from 'eventemitter3';

import {NativeClass, Message, MessageContentParser, IConnection, GUID, IStringTMap, IMessageSender} from '../core';

// simple loop-back connection, send a message and it receives it
export class BaseConnection extends NativeClass implements IConnection {

    readonly verbose = true;

    private _messageSubject : Rx.Subject<Message> = new Rx.Subject<Message>();
    private _messageObservable: Rx.Observable<Message> = this._messageSubject.asObservable();
    private _identifier : string;
    private _destroyed : boolean = false;

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

    canSendMessage() : boolean {
        return this._destroyed == false;
    }

    sendMessage(message : Message) {
        // subclasses should implement this
    }

    destroy() {
        this._destroyed = true;
    }
}


export interface ISubscriptionMap extends IStringTMap<Rx.Subscription> { }

export class BaseConnector extends NativeClass implements IMessageSender {

    readonly verbose = true;
    private _error : Error;
    private _connections : BaseConnection[] = [];
    private _emitter : any = new EventEmitter();

    // combines incomming messages from all connections
    private _messageSubject : Rx.Subject<Message> = new Rx.Subject<Message>();
    private _messageObservable: Rx.Observable<Message> = this._messageSubject.asObservable();

    // message subscriptions for each connection
    private _messageSubscriptions : ISubscriptionMap = {};

    constructor(private _parser : MessageContentParser) {
        super();
        console.log(this.tag + ' constructor');
    }

    get error() { return this._error; }
    get emitter() { return this._emitter; }
    get parser() { return this._parser; }

    get messageObservable() : Rx.Observable<Message> { return this._messageObservable; }

    canSendMessage() : boolean { return true; }

    sendMessage(message : Message) {
        console.log(this.tag + ' ' + JSON.stringify(message.toJSON()));
        this._connections.forEach(connection => {
            if (connection.canSendMessage()) {
                connection.sendMessage(message);
            }
        });
    }

    start(config : any) : Q.Promise<void> {
        return Q();
    }

    stop() : Q.Promise<void> {
        return Q().then(() => {
            this.resetError();
        });
    }

    // needs to be public so that it can be called by the connection
    destroyConnection(connection : BaseConnection) {

        if (this.knownConnectionIdentifier(connection.identifier) == false) {
            console.warn(this.tag + ' destroying dead connection!');
        }

        console.log(this.tag + ' destroying connection!');

        connection.destroy();

        if (_.has(this._messageSubscriptions, connection.identifier)) {
            this._messageSubscriptions[connection.identifier].unsubscribe();
        }

        this._connections = _.without(this._connections, connection);
        this.emitter.emit('disconnection', connection);
    }

    protected knownConnectionIdentifier(identifier : string) : boolean {
        const connection : BaseConnection = this._connections.find(candidate => {
            return candidate.identifier == identifier
        });
        return !!connection;
    }

    protected registerConnection(connection : BaseConnection) {

        // shouldn't happen but better be safe...
        if (_.has(this._messageSubscriptions, connection.identifier)) {
            this._messageSubscriptions[connection.identifier].unsubscribe();
        }

        // on connection message, relay the message through the connector's observable
        this._messageSubscriptions[connection.identifier] = connection.messageObservable.subscribe(message => {
            this._messageSubject.next(message);
        });

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
