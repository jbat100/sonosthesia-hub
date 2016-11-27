
import * as Rx from 'rx';
import {EventEmitter} from 'eventemitter3';

import {Message} from './core';

export interface IConnection {

    messageObservable : Rx.Observable<Message>;

}

export enum ConnectorState {
    None,
    Started,
    Stopped,
    Error
}

// not sure this a good idea, waiting to have played with Rx a bit, until then, sticking with event emitters

export interface IConnector {

    emitter : EventEmitter;

    // not sure this a good idea, waiting to have played with Rx a bit, until then, sticking with event emitters
    //stateObservable : Rx.Observable<ConnectorState>;
    //connectionObservable : Rx.Observable<IConnection>;
    //disconnectionObservable : Rx.Observable<IConnection>;

}