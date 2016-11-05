'use strict';

const _ = require('underscore');
const q = require('q');

const core = require('./core');
const ComponentConnector = require('./connector').ComponentConnector;
const Configuration = require('./configuration').Configuration;

class ComponentManager extends core.NativeEmitterClass {

    constructor(configuration) {
        core.NativeClass.checkInstanceClass(configuration, Configuration);
        this._configuration = configuration;
        this._connector = new ComponentConnector();
        this._components = {}; //components by identifier
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