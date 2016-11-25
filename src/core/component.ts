'use strict';

const _ = require('underscore');
const Enum = require('enum');
const expect = require('chai').expect;

const NativeEmitterClass = require('./core').NativeEmitterClass;
const Info = require('./core').Info;
const Selection = require('./core').Selection;
const Range = require('./core').Range;

// ---------------------------------------------------------------------------------------------------------------------
// INFO

/**
 *
 */

class ComponentInfo extends Info {

    constructor() {
        super();
        this._channels = {};
    }

    applyJSON(obj) {
        super.applyJSON(obj);
        expect(obj.channels).to.be.instanceof(Array);
        this._channels = _.map(obj.channels, channel => { return ChannelInfo.newFromJson(channel); });
    }

    get channels() { return this._channels; }

}


const ChannelFlow = new Enum(['emitter', 'receiver']);

class ChannelInfo extends Info {

    constructor() {
        super();
        this._flow = ChannelFlow.emitter;
        this._producer = false;
        this._parameters = {};
    }

    applyJSON(obj) {
        super.applyJSON(obj);
        expect(obj.parameters).to.be.instanceof(Array);
        this._parameters = _.map(obj.parameters, parameter => { return ParameterInfo.newFromJson(parameter); });
        expect(ChannelFlow.get(obj.flow)).to.be.ok;
        this._flow = ChannelFlow.get(obj.flow);
        expect(obj.producer).to.be.a('boolean');
        this._producer = obj.producer;
    }

    get flow() { return this._flow; }

    get producer() { return this._producer; }

    get parameters() { return this._parameters; }

}

class ParameterInfo extends Info {

    constructor() {
        super();
        this._default = 0.0;
        this._range = null;
    }

    applyJSON(obj) {
        super.applyJSON(obj);
        expect(obj.default).to.be.a('number');
        this._default = obj.default;
        expect(obj.range).to.be.an('object');
        this._range = new Range(obj.min, obj.max);
    }

    get default() { return this._default; }

    get range() { return this._range; }

}

// ---------------------------------------------------------------------------------------------------------------------
// SELECTION

class ComponentSelection extends Selection { }

class ChannelSelection extends Selection {

    constructor(identifier, component) {
        super(identifier);
        expect(component).to.be.instanceof(ComponentSelection);
        this._component = component;
    }

    get component() { return this._component; }

}

class ParameterSelection extends Selection {

    constructor(identifier, channel) {
        super(identifier);
        expect(channel).to.be.instanceof(ChannelSelection);
        this._channel = channel;
    }

    get component() { return this._component; }

}

// ---------------------------------------------------------------------------------------------------------------------
// MANAGER ?

class ComponentManager extends NativeEmitterClass {

    constructor() {

    }

}


