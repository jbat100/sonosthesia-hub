'use strict';

const _ = require('underscore');
const Enum = require('enum');
const expect = require('chai').expect;

const NativeClass = require('./core').NativeClass;

const ComponentInfo = require('./component').ComponentInfo;

class Parameters extends NativeClass {

    static newFromJson(obj) {
        expect(obj).to.be.an('object');
        const parameters = new this();
        _.each(obj, (value, key) => {
            parameters.setParameter(key, value);
        });
        return parameters;
    }

    constructor() {
        super();
        this._values = {};
    }

    getKeys() {
        return _.keys(this._settings);
    }

    setParameter(key, value) {
        expect(key).to.be.a('string');
        if (!key) throw new Error('invalid key');
        if (typeof value === 'number') value = [value];
        if (!_.isArray(value)) throw new Error('value should be number or array');
        this._values[key] = value;
    }

    getParameter(key) {
        if (!_.has(this._values, key)) throw new Error('unknown key');
        return this._values[key];
    }

}


class Message extends NativeClass {

    constructor() {

    }
}

class ComponentMessage extends Message {

    static newFromJson(obj) {
        return new this(new ComponentInfo(obj.content));
    }

    constructor(component) {
        super();
        NativeClass.checkInstanceClass(component, ComponentInfo);
        this._component = component;
    }

    get component() { return this._component; }

}

/**
 * Abstract base for control, create and destroy messages
 */
class ChannelMessage extends Message {

    static newFromJson(obj) {
        return new this(obj.content.channel, obj.content.object, new Parameters(obj.content.parameters));
    }

    constructor(channel, object, parameters) {
        super();
        expect(channel).to.be.a('string');
        if (object) expect(object).to.be.a('string');
        NativeClass.checkInstanceClass(parameters, Parameters);
        this._channel = channel;
        this._object = object;
        this._parameters = parameters;
    }

    get channel() { return this._channel; }

    get object() { return this._object; }

    get parameters() { return this._parameters; }

}

class ControlMessage extends ChannelMessage { }

/**
 * Object cannot be null
 */
class ObjectMessage extends ChannelMessage {

    constructor(channel, object, parameters) {
        expect(object).to.be.ok;
        super(channel, object, parameters);
    }

}

class CreateMessage extends ObjectMessage { }

class DestroyMessage extends ObjectMessage { }

const MessageClasses = {
    'component': ComponentMessage,
    'control': ControlMessage,
    'create': CreateMessage,
    'destroy': DestroyMessage
};

class MessageParser extends NativeClass {

    static newFromJson(obj) {
        expect(obj.type).to.be.a('string');
        if (!_.has(MessageClasses, obj.type)) throw new Error('unsuported message type : ' + obj.type);
        return MessageClasses[obj.type].newFromJson(obj);
    }

}