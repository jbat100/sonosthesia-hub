import * as _ from "underscore";
import * as Q from "q";
import {expect} from "chai";

import {NativeClass} from "../core/core";
import {Configuration} from './configuration';
import {IConnector, IConnection} from "../core/interface";


class HubManager extends NativeClass {

    constructor(private _configuration : Configuration, private _connector : IConnector) { }

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

    }

    getComponent(identifier) {
        _.find(this._components, component => { return component.identifier === identifier; });
    }

}