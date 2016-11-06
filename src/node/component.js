'use strict';

const _ = require('underscore');

const NativeEmitterClass = require('./core').NativeEmitterClass;
const Declarable = require('./core').Declarable;
const Reference = require('./core').Reference;

/**
 *
 */



class Component extends Declarable {

    constructor(identifier) {
        super(identifier);
        this.channels = {};
    }

    _applyInfo(info) {
        this.channels = _.mapObject(info.channels, (info, identifier) => { return Channel.create(identifier, info); });
    }

}

class ComponentReference extends Reference {

    static get targetClass() { return Component; }

}

class Channel extends Declarable {

    constructor(identifier) {
        super(identifier);
        // emitter / receiver ?
        // producer ?
        this.parameters = {};
    }

}





