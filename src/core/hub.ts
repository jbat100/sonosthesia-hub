'use strict';

const _ = require('underscore');
const q = require('q');

const NativeClass = require('./core').NativeClass;
const NativeEmitterClass = require('./core').NativeEmitterClass;
const ComponentConnector = require('./connector').ComponentConnector;
const Configuration = require('./configuration').Configuration;

class HubManager extends NativeEmitterClass {

    constructor(configuration) {
        NativeClass.checkInstanceClass(configuration, Configuration);
        this._configuration = configuration;
        this._connector = new ComponentConnector();
    }

    get configuration() { return this._configuration; }
    get connector() { return this._connector; }

    setup() {
        return q().then(() => {

        });
    }

    createComponent(identifier) {

    }

    getComponent(identifier) {
        _.find(this._components, component => { return component.identifier === identifier; });
    }

}