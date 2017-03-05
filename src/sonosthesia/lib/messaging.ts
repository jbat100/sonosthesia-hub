
import * as _ from "underscore";
import { expect } from 'chai';

import {NativeClass, MessageContentParser, Message} from './core';
import { ComponentInfo } from './component';


export class Parameters extends NativeClass {

    private _values = {};

    // accepts null for empty parameter set
    static newFromJSON(obj : any) {
        const parameters = new this();
        if (obj) {
            expect(obj).to.be.an('object');
            _.each(obj, (value, key : string) => {
                expect(key).to.be.a('string');
                if (typeof value === 'number') value = [value];
                if (!_.isArray(value)) throw new Error('value should be number or array');
                parameters.setParameter(key, value);
            });
        }
        return parameters;
    }

    toJSON() : any {
        return this._values;
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

}


export class MessageContent extends NativeClass {

    toJSON() : any {
        return {};
    }

}

export class ComponentMessageContent extends MessageContent {

    static newFromJSON(obj : any) {
        expect(obj.component).to.be.an('object');
        const component : ComponentInfo = ComponentInfo.newFromJSON(obj.component) as ComponentInfo;
        return new this(component);
    }

    constructor(private _component : ComponentInfo) {
        super();
    }

    toJSON() : any {
        return {
            component : this.component.toJSON()
        }
    }

    get component() : ComponentInfo { return this._component; }

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
        this.checkJSON(obj);
        const parameters = Parameters.newFromJSON(obj.parameters);
        return new this(obj.component, obj.channel, obj.instance, obj.key, parameters);
    }

    constructor(private _component : string,
                private _channel : string,
                private _instance : string,
                private _key : string,
                private _parameters : Parameters) {
        super();
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
    Component,
    Action,
    Control,
    Create,
    Destroy
}

const HubMessageContentClasses = new Map<HubMessageType, typeof MessageContent>();

HubMessageContentClasses[HubMessageType.Component] = ComponentMessageContent;
HubMessageContentClasses[HubMessageType.Control] = ControlMessageContent;
HubMessageContentClasses[HubMessageType.Action] = ActionMessageContent;
HubMessageContentClasses[HubMessageType.Create] = CreateMessageContent;
HubMessageContentClasses[HubMessageType.Destroy] = DestroyMessageContent;


export class HubMessage extends Message {

    // this subclass enforces a given set of types and checks that the content passed to the constructor matches the type

    static newFromJSON(obj : any, parser : MessageContentParser) : Message {
        this.checkJSON(obj);
        const hubMessageType : HubMessageType = HubMessageType[obj.type as string];
        return new this(hubMessageType, new Date(<string>obj.date), parser.parse(obj.type, obj.content)) as Message;
    }

    static contentClass(type : HubMessageType) : any {
        return HubMessageContentClasses.get(type);
    }

    private _hubMessageType : HubMessageType;

    constructor(type : HubMessageType, date : Date, content : any) {
        // note that Map has doesn't seem to work
        const expectedContentClass = HubMessageContentClasses[type];
        if (!expectedContentClass) throw new Error('unsupported message type : ' + type);
        //const expectedContentClass = HubMessageContentClasses[type];
        expect(content).to.be.instanceOf(expectedContentClass);
        super(HubMessageType[type] as string, date, content);
        this._hubMessageType = type;
    }

    get hubMessageType() : HubMessageType { return this._hubMessageType; }

}

export class HubMessageContentParser extends MessageContentParser {

    parse(typeStr : string, content : any) : any {
        const type : HubMessageType = HubMessageType[typeStr];
        // note that Map has doesn't seem to work
        const contentClass = HubMessageContentClasses[type];
        if (!contentClass) throw new Error('unsupported message type : ' + type);
        return contentClass.newFromJSON(content);
    }

}