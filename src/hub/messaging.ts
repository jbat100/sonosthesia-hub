
import * as _ from "underscore";
import { expect } from 'chai';

import { NativeClass, MessageContentParser } from '../core/core';
import { ComponentInfo } from './component';


export class Parameters extends NativeClass {

    private _values = {};

    static newFromJson(obj : any) {
        expect(obj).to.be.an('object');
        const parameters = new this();
        _.each(obj, (value, key) => {
            expect(key).to.be.a('string');
            if (typeof value === 'number') value = [value];
            if (!_.isArray(value)) throw new Error('value should be number or array');
            parameters.setParameter(key, value);
        });
        return parameters;
    }

    getKeys() : string[] {
        return _.keys(this._settings);
    }

    setParameter(key : string, value : number[]) {
        if (!key) throw new Error('invalid key');
        this._values[key] = value;
    }

    getParameter(key : string) : number[]  {
        if (!_.has(this._values, key)) throw new Error('unknown key');
        return this._values[key];
    }

}


export class MessageContent extends NativeClass {

}

export class ComponentMessageContent extends MessageContent {

    static newFromJson(obj : any) {
        expect(obj.component).to.be.an('object');
        const component : ComponentInfo = ComponentInfo.newFromJSON(obj.component) as ComponentInfo;
        return new this(component);
    }

    constructor(private _component : ComponentInfo) {
        super();
    }

    get component() : ComponentInfo { return this._component; }

}

/**
 * Abstract base for control, create and destroy messages
 */

export class ChannelMessageContent extends MessageContent {

    static newFromJson(obj : any) {
        expect(obj.component).to.be.an('object');
        expect(obj.component).to.be.a('string');
        expect(obj.channel).to.be.a('string');
        expect(obj.object).to.be.a('string');
        return new this(obj.component, obj.channel, obj.object, Parameters.newFromJson(obj.parameters));
    }

    constructor(private _component : string,
                private _channel : string,
                private object : string,
                private parameters : Parameters) {

        super();
    }

    get component() : string { return this._component; }

    get channel() : string { return this._channel; }

    get object() : string { return this._object; }

    get parameters() : Parameters { return this._parameters; }

}

export class ControlMessageContent extends ChannelMessageContent { }

/**
 * Object cannot be null
 */
export class ObjectMessageContent extends ChannelMessageContent {

    constructor(_component : string, _channel : string, object : string, parameters : Parameters) {
        expect(object).to.be.ok;
        super(component, channel, object, parameters);
    }

}

export class CreateMessageContent extends ObjectMessageContent { }

export class DestroyMessageContent extends ObjectMessageContent { }



export enum HubMessageType {
    component,
    control,
    create,
    destroy
}

export class HubMessageContentParser extends MessageContentParser {

    private _contentClasses = {
        'component' : ComponentMessage,
        'control' : ControlMessage,
        'create': CreateMessage,
        'destroy': DestroyMessage
    };

    parse(type : string, content : any) : any {
        if (!_.has(MessageClasses, type)) throw new Error('unsuported message type : ' + type);
        return MessageContentClasses[type].newFromJson(obj);
    }

}