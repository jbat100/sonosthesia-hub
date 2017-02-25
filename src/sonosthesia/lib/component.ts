
import * as _ from "underscore";
import {expect} from "chai";

import {NativeClass, Info, InfoSet, Selection, Range, IConnection} from "./core";
import {HubMessage} from "./messaging";

// ---------------------------------------------------------------------------------------------------------------------
// Info classes represent the declarations of available components (and their channels) made by connections, they are
// pure data containers, and persist only for as long as the connection which declared them
// they have both a JSON get/set interface and a property based interface has they can be manipulated by network messages
// or locally

export class ComponentInfo extends Info {

    private _channelSet = new InfoSet<ChannelInfo>(ChannelInfo);

    applyJSON(obj:any) {
        super.applyJSON(obj);
        this._channelSet.applyJSON(obj.channels as any[]);
    }

    get channelSet() : InfoSet<ChannelInfo> { return this._channelSet; }

    toJSON() : any {
        const obj : any = super.toJSON();
        obj['channels'] = this._channelSet.toJSON();
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

    private _parameterSet = new InfoSet<ParameterInfo>(ParameterInfo);

    applyJSON(obj : any) {
        super.applyJSON(obj);
        this._parameterSet.applyJSON(obj.parameters);
        expect(ChannelFlow[obj.flow]).to.be.ok;
        this._flow = ChannelFlow[<string>obj.flow];
        expect(ChannelType[obj.type]).to.be.ok;
        this._type = ChannelType[<string>obj.type];
    }

    get flow() : ChannelFlow { return this._flow; }

    set flow(_flow : ChannelFlow) { this._flow = _flow; }

    get type() : ChannelType { return this._type; }

    set type(_type : ChannelType) { this._type = _type; }

    get parameterSet() : InfoSet<ParameterInfo> { return this._parameterSet; }

    toJSON() : any {
        const obj = super.toJSON();
        obj.flow = ChannelFlow[this.flow]; // convert to string
        obj.producer = ChannelType[this.type];
        obj.parameters = this._parameterSet.toJSON();
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

    set defaultValue(val : number) { this._defaultValue = val; }

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

    private _componentSelection : ComponentSelection;

    constructor(channelIdentifier : string, compomentIdentifier : string) {
        super(channelIdentifier);
        this._componentSelection = new ComponentSelection(compomentIdentifier);
    }

    get componentSelection() { return this._componentSelection; }

}

export class ParameterSelection extends Selection {

    private _channelSelection : ChannelSelection;

    constructor(parameterIdentifier : string, channelIdentifier : string, compomentIdentifier : string) {
        super(channelIdentifier);
        this._channelSelection = new ChannelSelection(channelIdentifier, compomentIdentifier);
    }

    get channelSelection() { return this._channelSelection; }

}

// ---------------------------------------------------------------------------------------------------------------------
//

// a controller has an info (Info subclass), doing a generic class to centralise setup/teardown/update dynamics
export class BaseController <T extends Info> extends NativeClass {

    constructor(private _info : T) {
        super();
    }

    get info() : T { return this._info; }

    set info(val : T) { this._info = val; }

    public update(info : T) {
        if (info && this._info && this._info.identifier !== info.identifier)
            throw new Error('the identifier specified in info must remain constant');
        this._info = info;
    }

    public reload() {

    }

}

export class ChannelController extends BaseController<ChannelInfo> {

    // an observable with only the messages addressed to this channel
    private _messageObservable: Rx.Observable<HubMessage>;

    constructor(info : ChannelInfo, private _componentController : ComponentController) {
        super(info);
        this._messageObservable = this._componentController.connection.messageObservable.filter(function (message, idx, obs) {
            return message.content.channel === this.info.identifier;
        });
    }

    get messageObservable() : Rx.Observable<HubMessage> { return this._messageObservable; }

    get componentController() : ComponentController { return this._componentController; }

    validateParameterSelection(selection : ParameterSelection) {
        const result = this.info.parameterSet.has(selection.identifier);
        selection.valid = result;
        return result;
    }

}

export class ComponentController extends BaseController<ComponentInfo> {

    private _channelControllers = new Map<string, ChannelController>();

    // an observable with only the messages addressed to this component
    private _messageObservable: Rx.Observable<HubMessage>;

    constructor(info : ComponentInfo, private _connection : IConnection) {
        super(info);
        this._messageObservable = this.connection.messageObservable.filter(function (message, idx, obs) {
            return message.content.component === this.info.identifier;
        });
    }

    get messageObservable() : Rx.Observable<HubMessage> { return this._messageObservable; }

    get connection() : IConnection { return this._connection; }

    validateParameterSelection(selection : ParameterSelection) {
        if (!this.validateChannelSelection(selection.channelSelection)) {
            selection.valid = false;
            return false;
        }
        const channelController = this.getChannelController(selection.channelSelection);
        return channelController.validateParameterSelection(selection);
    }

    validateChannelSelection(selection : ChannelSelection) {
        const result =  this._channelControllers.has(selection.identifier);
        selection.valid = result;
        return result;
    }

    getChannelController(selection : ChannelSelection) : ChannelController {
        return this._channelControllers.get(selection.identifier);
    }

    public update(info : ComponentInfo) {
        super.update(info);
        info.channelSet.elements().forEach((channelInfo : ChannelInfo) => {
            let controller = this._channelControllers.get(channelInfo.identifier);
            if (!controller) controller = new ChannelController(channelInfo, this);
            else controller.update(channelInfo);
        });
        // remove obsolete channel controllers, add required new channel controllers
        _.difference(Array.from(this._channelControllers.keys()), this.info.channelSet.identifiers()).forEach((id : string) => {
            this._channelControllers.delete(id);
        });
    }

}

/**
 * Note, allows multiple component declarations per connection (keyed by identifier). Cannot have duplicate
 * component identifiers
 */

export class ComponentManager extends NativeClass {

    private _componentControllers = new Map<string, ComponentController>();

    registerComponent(connection : IConnection, info : ComponentInfo) {
        if (!(info && info.identifier)) throw new Error('invalid identifier');
        let componentController = this._componentControllers.get(info.identifier);
        if (componentController) {
            if (componentController.connection !== connection)
                throw new Error('duplicate component declaration');
            componentController.update(info);
        } else {
            componentController = new ComponentController(info, connection);
            this._componentControllers.set(info.identifier, componentController);
        }
    }

    // in order to unregister a component, you must know its associated connection
    unregisterComponent(connection : IConnection, identifier : string) {
        let componentController = this._componentControllers.get(identifier);
        if (!componentController)
            throw new Error('unknown component identifier : ' + identifier);
        if (componentController.connection !== connection)
            throw new Error('component ' + identifier + ' is not associated with connection');
        this._componentControllers.delete(identifier);
    }

    // validate a component selection
    validateComponentSelection(selection : ComponentSelection) : boolean {
        const result =  this._componentControllers.has(selection.identifier);
        selection.valid = result;
        return result;
    }

    // validate a channel selection (including the associated component selection)
    validateChannelSelection(selection : ChannelSelection) {
        if (!this.validateComponentSelection(selection.componentSelection)) {
            selection.valid = false;
            return false;
        }
        const componentController = this.getComponentController(selection.componentSelection);
        return componentController.validateChannelSelection(selection);
    }

    // validate a full parameter selection (including the associated channel and component selections)
    validateParameterSelection(selection : ParameterSelection) {
        if (!this.validateChannelSelection(selection.channelSelection)) {
            selection.valid = false;
            return false;
        }
        const channelController = this.getChannelController(selection.channelSelection);
        return channelController.validateParameterSelection(selection);
    }

    getComponentController(selection : ComponentSelection) : ComponentController {
        return this._componentControllers.get(selection.identifier);
    }

    getComponentControllers(connection : IConnection) : ComponentController[] {
        return Array.from(this._componentControllers.values()).filter((controller : ComponentController) => {
            return controller.connection === connection
        });
    }

    getChannelController(selection : ChannelSelection) {
        const componentController = this.getComponentController(selection.componentSelection);
        return componentController ? componentController.getChannelController(selection) : null;
    }

    clean(connection : IConnection) {
        // get component identifiers for this connection
        this.getComponentControllers(connection).map((component : ComponentController) => {
            return component.info.identifier;
        }).forEach((identifier : string) => {
            this.unregisterComponent(connection, identifier);
        });
    }

}


