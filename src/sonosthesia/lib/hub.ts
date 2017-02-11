import * as _ from "underscore";
import * as Q from "q";

import {NativeClass, Message, IConnector, IConnection} from "./core";
import {Configuration} from './configuration';
import {HubMessageContentParser} from "./messaging";
import {ComponentManager} from "./component";


export class HubManager extends NativeClass {

    private _componentManager = new ComponentManager();

    constructor(private _configuration : Configuration, private _connector : IConnector) {
        super();
    }

    get configuration() { return this._configuration; }
    get componentManager() { return this._componentManager; }
    get connector() { return this._connector; }

    setup() {
        return Q(null).then(() => {

        });
    }

    teardown() {
        return Q(null).then(() => {

        });
    }

    setupConnection(connection : IConnection) {
        connection.messageObservable.subscribe((message : Message) => {

        });
    }

}