
import * as _ from "underscore";
import { expect } from 'chai';

import {NativeClass, MessageContentParser, Message, IStringTMap, IJSONSerialisable} from './core';
import { ComponentInfo } from './component';


export interface IFloatValuesMap extends IStringTMap<number[]> { }


export class Parameters extends NativeClass implements IJSONSerialisable {

    private _values : IFloatValuesMap = {};

    // accepts null for empty parameter set
    static newFromJSON(obj : any) {
        const parameters = new this();
        parameters.applyJSON(obj);
        return parameters;
    }

    toJSON() : any {
        return this._values;
    }

    applyJSON(obj : any) {
        if (obj) {
            this._values = {};
            expect(obj).to.be.an('object');
            _.each(obj, (value, key : string) => {
                expect(key).to.be.a('string');
                if (typeof value === 'number') value = [value];
                if (!_.isArray(value)) throw new Error('value should be number or array');
                this.setParameter(key, value);
            });
        }
    }

    getKeys() : string[] {
        return _.keys(this._values);
    }

    setParameter(key : string, value : number[]) {
        if (!key) throw new Error('invalid key');
        this._values[key] = value;
    }

    getParameter(key : string) : number[]  {
        if (!_.has(this._values, key)) throw new Error('unknown key');
        return this._values[key];
    }

    // special case when dimension 1 is expected
    getSingleParameter(key : string) : number {
        const parameter = this.getParameter(key);
        if (parameter.length == 1) {
            return parameter[0];
        } else {
            throw new Error('expected 1 dimension');
        }
    }

}


export class MessageContent extends NativeClass implements IJSONSerialisable {

    applyJSON(obj : any) { }

    toJSON() : any { return {}; }

}

export class ComponentMessageContent extends MessageContent {

    static newFromJSON(obj : any) {
        const content = new this(null);
        content.applyJSON(obj);
        return content
    }

    constructor(private _components : ComponentInfo[]) {
        super();
    }

    applyJSON(obj : any) {
        this._components = obj.components.map((component : any) => {
            return ComponentInfo.newFromJSON(component) as ComponentInfo;
        });
    }

    toJSON() : any {
        return {
            components : this._components.map(component => { return component.toJSON(); })
        }
    }

    get components() : ComponentInfo[] { return this._components }

}

/**
 * Abstract base for control, create and destroy messages
 */

export class ChannelMessageContent extends MessageContent {

    static checkJSON(obj : any) {
        // component and channel are mandatory
        expect(obj.component).to.be.a('string');
        expect(obj.channel).to.be.a('string');
        // instance and key are optional
        if (obj.instance) expect(obj.instance).to.be.a('string');
        if (obj.key) expect(obj.key).to.be.a('string');
    }

    static newFromJSON(obj : any) {
        const content = new this(null, null, null, null, null);
        content.applyJSON(obj);
        return content;
    }


    constructor(private _component : string,
                private _channel : string,
                private _instance : string,
                private _key : string,
                private _parameters : Parameters) {
        super();
    }

    applyJSON(obj : any) {
        ChannelMessageContent.checkJSON(obj);
        this._parameters = Parameters.newFromJSON(obj.parameters);
        this._component = obj.component;
        this._channel = obj.channel;
        this._instance = obj.instance;
        this._key = obj.key;
    }

    toJSON() : any {
        return {
            component : this.component,
            channel: this.channel,
            instance: this.instance, // may be null
            key: this.key, // may be null
            parameters: (this.parameters ? this.parameters.toJSON() : null)
        }
    }

    get component() : string { return this._component; }
    get channel() : string { return this._channel; }
    get instance() : string { return this._instance; }
    get key() : string { return this._key; }
    get parameters() : Parameters { return this._parameters; }


    // determine whether the message targets a channel or an instance

    isInstanceMessage() : boolean { return this.instance != null; }

}

// NOTE: for control and action messages, the presence of instance determined
// whether it is an instance (dynamic) or channel (static) message

export class ControlMessageContent extends ChannelMessageContent { }

export class ActionMessageContent extends ChannelMessageContent {

    static checkJSON(obj : any) {
        super.checkJSON(obj);
        // key is mandatory
        expect(obj.key).to.be.a('string');
    }

}

/**
 * Object cannot be null
 */
export class InstanceMessageContent extends ChannelMessageContent {

    static checkJSON(obj : any) {
        super.checkJSON(obj);
        // key is mandatory
        expect(obj.instance).to.be.a('string');
    }

}

export class CreateMessageContent extends InstanceMessageContent { }

export class DestroyMessageContent extends InstanceMessageContent { }


// may become necessary to distinguish between channel and instance versions of control and action messages

export enum HubMessageType {
    COMPONENT,
    ACTION,
    CONTROL,
    CREATE,
    DESTROY
}

const HubMessageContentClasses = new Map<HubMessageType, typeof MessageContent>();

HubMessageContentClasses[HubMessageType.COMPONENT] = ComponentMessageContent;
HubMessageContentClasses[HubMessageType.CONTROL] = ControlMessageContent;
HubMessageContentClasses[HubMessageType.ACTION] = ActionMessageContent;
HubMessageContentClasses[HubMessageType.CREATE] = CreateMessageContent;
HubMessageContentClasses[HubMessageType.DESTROY] = DestroyMessageContent;


export class HubMessage extends Message {

    // this subclass enforces a given set of types and checks that the content passed to the constructor matches the type

    static newFromJSON(obj : any, parser : MessageContentParser) : Message {
        this.checkJSON(obj);
        const typeStr = obj.type as string;
        const capitalised = typeStr.toUpperCase();
        const hubMessageType : HubMessageType = HubMessageType[capitalised];
        console.log('HubMessage.newFromJSON ' + capitalised + ' ' + hubMessageType);
        return new this(hubMessageType, +(obj.date as string), parser.parse(obj.type, obj.content)) as Message;
    }

    static newChannelMessage(type : HubMessageType,
                             component : string,
                             channel : string,
                             instance : string,
                             parameters : Parameters) {
        const ContentClass = this.contentClass(type);
        const content = new ContentClass(component, channel, instance, null, parameters);
        return new HubMessage(type, null, content);
    }

    static contentClass(type : HubMessageType) : any {
        // note .get does not work for some obscure reason
        return HubMessageContentClasses[type];
    }

    private _hubMessageType : HubMessageType;

    constructor(type : HubMessageType, timestamp : number, content : any) {
        // note that Map has doesn't seem to work
        const expectedContentClass = HubMessageContentClasses[type];
        if (!expectedContentClass) throw new Error('unsupported message type : ' + type);
        //const expectedContentClass = HubMessageContentClasses[type];
        expect(content).to.be.instanceOf(expectedContentClass);
        super((HubMessageType[type] as string).toLowerCase(), timestamp, content);
        this._hubMessageType = type;
    }

    get hubMessageType() : HubMessageType { return this._hubMessageType; }

}

export class HubMessageContentParser extends MessageContentParser {

    parse(typeStr : string, content : any) : any {
        const capitalised = typeStr.toUpperCase();
        const type : HubMessageType = HubMessageType[capitalised];
        // note that Map has doesn't seem to work
        const contentClass = HubMessageContentClasses[type];
        if (!contentClass) throw new Error(this.tag + ' unsupported message type : ' + type);
        return contentClass.newFromJSON(content);
    }

}