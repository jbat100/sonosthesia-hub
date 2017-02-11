
import * as _ from "underscore";
import {expect} from "chai";
import {NativeClass, Info, Selection, Range, IConnection} from "./core";

// ---------------------------------------------------------------------------------------------------------------------
// Info classes represent the declarations of available components (and their channels) made by connections, they are
// pure data containers, and persist only for as long as the connection which declared them

/**
 *
 */

export class ComponentInfo extends Info {

    private _channels : ChannelInfo[];

    applyJSON(obj:any) {
        super.applyJSON(obj);
        expect(obj.channels).to.be.instanceof(Array);
        this._channels = _.map(obj.channels, channel => { return ChannelInfo.newFromJSON(channel) as ChannelInfo; });
    }

    get channels() { return this._channels; }

    toJSON() : any {
        const obj : any = super.toJSON();
        obj['channels'] = _.map(this.channels, (channel : ChannelInfo) => { return channel.toJSON(); });
        return obj;
    }

}


export enum ChannelFlow {
    Undefined,
    Emitter,
    Receiver
}

export enum ChannelType {
    Undefined,
    Event,
    Control,
    Generator
}

export class ChannelInfo extends Info {

    private _flow = ChannelFlow.Emitter;
    private _type = ChannelType.Event;
    private _parameters : ParameterInfo[];

    applyJSON(obj : any) {
        super.applyJSON(obj);
        expect(obj.parameters).to.be.instanceof(Array);
        this._parameters = _.map(obj.parameters, parameter => {
            return ParameterInfo.newFromJSON(parameter) as ParameterInfo;
        });
        expect(ChannelFlow[obj.flow]).to.be.ok;
        this._flow = ChannelFlow[<string>obj.flow];
        expect(ChannelType[obj.type]).to.be.ok;
        this._type = ChannelType[<string>obj.type];
    }

    get flow() : ChannelFlow { return this._flow; }

    get type() : ChannelType { return this._type; }

    get parameters() : ParameterInfo[] { return this._parameters; }

    toJSON() : any {
        const obj = super.toJSON();
        obj.flow = ChannelFlow[this.flow]; // convert to string
        obj.producer = ChannelType[this.type];
        obj.parameters = _.map(this.parameters, (parameter : ParameterInfo) => {
            return parameter.toJSON();
        });
        return obj;
    }

}

export class ParameterInfo extends Info {

    private _defaultValue = 0.0;
    private _range : Range;

    applyJSON(obj) {
        super.applyJSON(obj);
        expect(obj.defaultValue).to.be.a('number');
        this._defaultValue = obj.defaultValue;
        this._range = Range.newFromJSON(obj.range);
    }

    get defaultValue() : number { return this._defaultValue; }

    get range() : Range { return this._range; }

    toJSON() {
        const obj : any = super.toJSON();
        obj.defaultValue = this.defaultValue;
        obj.range = this.range.toJSON();
        return obj;
    }

}

// ---------------------------------------------------------------------------------------------------------------------
// Selection classes represent user selections, they are originally made in reference to info declarations but can outlive
// the connections that made the info declarations (the selections become invalid when the referenced connection is dead)

export class ComponentSelection extends Selection { }

export class ChannelSelection extends Selection {

    private _component = new ComponentSelection();

    get component() { return this._component; }

}

export class ParameterSelection extends Selection {

    private _channel = new ChannelSelection();

    get channel() { return this._channel; }

}

// ---------------------------------------------------------------------------------------------------------------------
//

export class Component extends NativeClass {

    constructor(private _connection : IConnection, private _info : ComponentInfo) {
        super();
    }

    get connection() : IConnection { return this._connection; }

    get info() : ComponentInfo { return this._info; }

    set info(info : ComponentInfo) { this._info = info; }

}

/**
 * Note, allows multiple component declarations per connection (keyed by identifier). Cannot have duplicate
 * component identifiers
 */

export class ComponentManager extends NativeClass {

    private _components = new Map<string, Component>();

    registerComponent(connection : IConnection, info : ComponentInfo) {
        let component = this._components.get(info.identifier);
        if (!(info && info.identifier)) throw new Error('invalid identifier');
        if (component) {
            if (component.connection === connection) throw new Error('duplicate component declaration');
        } else {
            component = new Component(connection, info);
            this._components.set(info.identifier, component);
        }
        component.info = info;
    }

    // in order to unregister a component, you must know its associated connection
    unregisterComponent(connection : IConnection, identifier : string) {
        let component = this._components.get(identifier);
        if (!component) {
            throw new Error('unknown component identifier : ' + identifier);
        } else if (component.connection !== connection) {
            throw new Error('component ' + identifier + ' is not associated with connection');
        }
        this._components.delete(identifier);
    }

    getComponent(identifier : string, required? : boolean) : Component {
        if (required !== false) required = true;
        const result : Component = this._components.get(identifier);
        if ((!result) && required) throw new Error('unknown component identifier : ' + identifier);
        return result;
    }

    getComponents(connection : IConnection, required? : boolean) : Component[] {
        if (required !== false) required = true;
        const components = [];
        this._components.forEach((component : Component, identifier : string) => {
            if (component.connection === connection) components.push(component);
        });
        return components;
    }

    clean(connection : IConnection) {
        // get component identifiers for this connection
        const identifiers = this.getComponents(connection).map((component :Component) => {
            return component.info.identifier;
        });
        // and remove them...
        for (let identifier of identifiers) {
            this._components.delete(identifier);
        }
    }

}


