import * as _ from "underscore";
import * as Q from "q";

import {NativeClass, Message} from "../core/core";
import {Configuration} from './configuration';
import {IConnector, IConnection} from "../core/interface";
import {HubMessageContentParser} from "./messaging";
import {ComponentManager} from "./component";


export class HubManager extends NativeClass {

    private _messageContentParser = new HubMessageContentParser();

    private _componentManager = new ComponentManager();

    constructor(private _configuration : Configuration, private _connector : IConnector) {
        super();
    }

    get configuration() { return this._configuration; }

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
            message.parse(this._messageContentParser);

        });
    }

    getComponent(identifier) {
        _.find(this._components, component => { return component.identifier === identifier; });
    }

}