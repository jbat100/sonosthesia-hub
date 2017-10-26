
import * as Rx from 'rxjs/Rx';

import * as Q from "q";
import * as _ from "underscore";
import { expect} from "chai";

import { NativeClass, Info, InfoSet, Selection, Range, IConnection, GUID, FileUtils, Message, IStringTMap } from "./core";
import { HubMessage, Parameters, HubMessageType } from "./messaging";
import { ValueGeneratorType, ValueGeneratorContainer, IValueGeneratorMap } from "./generator";
import { PeriodicDriver } from "./driver";

// ---------------------------------------------------------------------------------------------------------------------
// Info classes represent the declarations of available components (and their channels) made by connections, they are
// pure data containers, and persist only for as long as the connection which declared them
// they have both a JSON get/set interface and a property based interface has they can be manipulated by network messages
// or locally

export class ComponentInfo extends Info {

    static importFromFile(filePath) : Q.Promise<ComponentInfo[]> {
        console.log('ComponentInfo importing from file ' + filePath);
        return FileUtils.readJSONFile(filePath).then((obj : any) => {
            if (obj.components) {
                return obj.components.map((infoObj : any) => { return ComponentInfo.newFromJSON(infoObj); });
            } else if (obj.component) {
                return [ComponentInfo.newFromJSON(obj.component)];
            } else {
                return [];
            }
        });
    }

    private _channelSet = new InfoSet<ChannelInfo>(ChannelInfo);

    constructor() {
        super();
    }

    applyJSON(obj:any) {
        super.applyJSON(obj);
        if (obj.channels) this._channelSet.applyJSON(obj.channels as any[]);
    }

    get channelSet() : InfoSet<ChannelInfo> { return this._channelSet; }

    get channels() : ChannelInfo[] { return this.channelSet.elements(); }

    getChannelInfo(identifier : string) : ChannelInfo {
        return this._channelSet.getElement(identifier);
    }

    toJSON() : any {
        const obj : any = super.toJSON();
        obj['channels'] = this._channelSet.toJSON();
        return obj;
    }

}

export enum ChannelFlow {
    Undefined,
    Emitter,
    Receiver,
    Duplex
}

export enum ChannelType {
    Undefined,
    Event,
    Control
}

export class ChannelInfo extends Info {

    private _flow = ChannelFlow.Undefined;
    private _type = ChannelType.Undefined;

    private _generator = true;

    private _parameterSet = new InfoSet<ParameterInfo>(ParameterInfo);

    applyJSON(obj : any) {
        super.applyJSON(obj);
        if (obj.parameters) this._parameterSet.applyJSON(obj.parameters);
        if (obj.flow) {
            expect(ChannelFlow[obj.flow]).to.be.ok;
            this._flow = ChannelFlow[<string>obj.flow];
        }
        if (obj.type) {
            expect(ChannelType[obj.type]).to.be.ok;
            this._type = ChannelType[<string>obj.type];
        }
    }

    get canEmit() : boolean {
        return this._flow === ChannelFlow.Duplex ||
            this._flow === ChannelFlow.Emitter ||
            this._flow === ChannelFlow.Undefined;
    }

    get canReceive() : boolean {
        return this._flow === ChannelFlow.Duplex ||
            this._flow === ChannelFlow.Receiver ||
            this._flow === ChannelFlow.Undefined;
    }

    get eventSupport() : boolean {
        return this._type === ChannelType.Event ||
            this.type === ChannelType.Undefined;
    }

    get controlSupport() : boolean {
        return this._type === ChannelType.Control ||
            this.type === ChannelType.Undefined;
    }

    get flow() : ChannelFlow { return this._flow; }

    set flow(_flow : ChannelFlow) { this._flow = _flow; }

    get type() : ChannelType { return this._type; }

    set type(_type : ChannelType) { this._type = _type; }

    get parameterSet() : InfoSet<ParameterInfo> { return this._parameterSet; }

    get parameters() : ParameterInfo[] { return this.parameterSet.elements(); }

    getParameterInfo(identifier : string) : ParameterInfo {
        return this._parameterSet.getElement(identifier);
    }

    toJSON() : any {
        const obj = super.toJSON();
        obj.flow = this.flow ? ChannelFlow[this.flow] : null; // convert to string
        obj.producer = this.type ? ChannelType[this.type] : null;
        obj.parameters = this._parameterSet.toJSON();
        return obj;
    }

}

export class ParameterInfo extends Info {

    private _defaultValue = 0.0;
    private _range : Range;

    static Create(identifier : string = null, defaultValue : number = 0.0, minValue : number = 0.0, maxValue : number = 1.0) : ParameterInfo {
        const info = new ParameterInfo();
        if (identifier) info.identifier = identifier;
        info._defaultValue = defaultValue;
        info._range = new Range(minValue, maxValue);
        return info;
    }

    applyJSON(obj) {
        super.applyJSON(obj);
        if (obj.defaultValue) {
            expect(obj.defaultValue).to.be.a('number');
            this._defaultValue = obj.defaultValue;
        } else {
            this._defaultValue = 0.0;
        }
        if (obj.range) {
            this._range = Range.newFromJSON(obj.range);
        } else {
            this._range = new Range(0.0, 1.0);
        }
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

    // change fires if either the channel or the component selection changes
    get changeObservable() : Rx.Observable<void> {
        return Rx.Observable.merge(this._changeObservable, this._componentSelection.changeObservable);
    }

    applyChannelSelection(channelSelection : ChannelSelection) {
        this.identifier = channelSelection.identifier;
        this.componentSelection.identifier = channelSelection.componentSelection.identifier;
    }
}

export class ParameterSelection extends Selection {

    private _channelSelection : ChannelSelection;

    constructor(parameterIdentifier : string, channelIdentifier : string, compomentIdentifier : string) {
        super(channelIdentifier);
        this._channelSelection = new ChannelSelection(channelIdentifier, compomentIdentifier);
    }

    get channelSelection() { return this._channelSelection; }

    // change fires if either the channel or the channel selection changes
    get changeObservable() : Rx.Observable<void> {
        return Rx.Observable.merge(this._changeObservable, this._channelSelection.changeObservable);
    }

}

// validator interfaces, keep coupling down by not imposing a specific validator type

export interface IParameterSelectionValidator {
    validateParameterSelection(selection : ParameterSelection) : boolean;
}

export interface IChannelSelectionValidator extends IParameterSelectionValidator {
    validateChannelSelection(selection : ChannelSelection) : boolean;
}

export interface IComponentSelectionValidator extends IChannelSelectionValidator {
    validateComponentSelection(selection : ComponentSelection) : boolean
}



// ---------------------------------------------------------------------------------------------------------------------
//

// a controller has an info (Info subclass), doing a generic class to centralise setup/teardown/update dynamics
export class BaseController <T extends Info> extends NativeClass {

    private _infoSource = new Rx.BehaviorSubject<T>(null);
    private _infoObservable : Rx.Observable<T> = this._infoSource.asObservable();
    private _info : T;

    get infoObservable() : Rx.Observable<T> { return this._infoObservable; }

    get info() : T { return this._info; }

    set info(val : T) { this._info = val; }

    // if you need to do stuff on update then override internalUpdate not update
    public update(info : T) {
        if (info && this._info && this._info.identifier !== info.identifier)
            throw new Error('the identifier specified in info must remain constant');
        this._info = info;
        this.internalUpdate(info);
        this._infoSource.next(info);
    }

    public reload() {
        this.internalUpdate(this.info);
    }

    // override this for customised info update
    protected internalUpdate(info : T) {

    }

}

export class ChannelController extends BaseController<ChannelInfo> implements IParameterSelectionValidator {

    // an observable with only the messages addressed to this channel
    private _incomingMessageSource = new Rx.Subject<HubMessage>();
    private _incomingMessageObservable = this._incomingMessageSource.asObservable();
    private _componentMessageSubscription : Rx.Subscription;

    private _incomingCountSource = new Rx.BehaviorSubject<number>(0);
    private _incomingCountObservable = this._incomingCountSource.asObservable();

    private _outgoingCountSource = new Rx.BehaviorSubject<number>(0);
    private _outgoingCountObservable = this._outgoingCountSource.asObservable();

    constructor(private _componentController : ComponentController) {
        super();
        // get an
        this._componentMessageSubscription = this.componentController.incomingMessageObservable.filter((message, idx) => {
            return this.info && message.content.channel === this.info.identifier;
        }).subscribe((message : HubMessage) => {
            this.processIncomingMessage(message);
        });
    }

    get incomingMessageObservable() : Rx.Observable<HubMessage> { return this._incomingMessageObservable; }

    get componentController() : ComponentController { return this._componentController; }

    get incomingCountObservable() : Rx.Observable<number> { return this._incomingCountObservable; }

    get outgoingCountObservable() : Rx.Observable<number> { return this._outgoingCountObservable; }

    sendOutgoingMessage(message : HubMessage) {
        if (message.content.channel !== this.info.identifier) {
            throw new Error('invalid message channel ' + message.content.channel);
        }
        console.log(this.tag + this.info.identifier + ' send outgoing message ' + message.type);
        this.componentController.sendOutgoingMessage(message);
        this._outgoingCountSource.next(this._outgoingCountSource.getValue() + 1);
    }

    processIncomingMessage(message : HubMessage) {
        if (message.content.channel !== this.info.identifier) {
            throw new Error('invalid message channel ' + message.content.channel);
        }
        console.log(this.tag + this.info.identifier + ' process incoming message ' + message.type);
        this._incomingMessageSource.next(message);
        this._incomingCountSource.next(this._incomingCountSource.getValue() + 1);
    }

    validateParameterSelection(selection : ParameterSelection) : boolean {
        const result = this.info.parameterSet.has(selection.identifier);
        selection.valid = result;
        return result;
    }

    teardown() {
        if (this._componentMessageSubscription) {
            this._componentMessageSubscription.unsubscribe();
            this._componentMessageSubscription = null;
        }
    }

}


export interface IChannelControllerMap extends IStringTMap<ChannelController> { }

export class ComponentController extends BaseController<ComponentInfo> implements IChannelSelectionValidator  {

    private _channelControllerMap: IChannelControllerMap = {};
    private _channelControllerSource = new Rx.BehaviorSubject<ChannelController[]>([]);
    private _channelControllersObservable = this._channelControllerSource.asObservable();

    // an observable with only the messages addressed to this component
    private _incomingMessageObservable: Rx.Observable<HubMessage>;

    private _messageCount = 0;

    constructor(private _connection : IConnection) {
        super();
        this._incomingMessageObservable = this.connection.messageObservable.filter((message : Message, idx) => {
            return this.info && message.content.component === this.info.identifier;
        }).map((message : Message, idx) => {
            return message as HubMessage;
        }).do((message : HubMessage) => {
            this._messageCount++;
        });
        this.updateChannelControllerSource();
    }

    get channelControllersObservable() : Rx.Observable<ChannelController[]> {
        return this._channelControllersObservable;
    }

    get channelControllers() : ChannelController[] {
        return this._channelControllerSource.getValue();
    }

    get incomingMessageObservable() : Rx.Observable<HubMessage> { return this._incomingMessageObservable; }

    get connection() : IConnection { return this._connection; }

    // should not be used directly, send messages using channel controllers
    sendOutgoingMessage(message : HubMessage) {
        if (message.content.component !== this.info.identifier) {
            throw new Error('invalid message component ' + message.content.component);
        }
        this.connection.sendMessage(message);
    }

    validateParameterSelection(selection : ParameterSelection) : boolean {
        if (!this.validateChannelSelection(selection.channelSelection)) {
            selection.valid = false;
            return false;
        }
        const channelController = this.getChannelController(selection.channelSelection);
        return channelController.validateParameterSelection(selection);
    }

    validateChannelSelection(selection : ChannelSelection) : boolean {
        const result =  _.has(this._channelControllerMap, selection.identifier);
        selection.valid = result;
        return result;
    }

    getChannelController(selection : ChannelSelection) : ChannelController {
        return this._channelControllerMap[selection.identifier];
    }

    teardown() {
        for (let controller of _.values(this._channelControllerMap)) { controller.teardown(); }
        this._channelControllerMap = {};
        this.updateChannelControllerSource();
    }

    protected internalUpdate(info : ComponentInfo) {
        super.internalUpdate(info);
        info.channelSet.elements().forEach((channelInfo : ChannelInfo) => {
            let controller = this._channelControllerMap[channelInfo.identifier];
            if (!controller) {
                controller = new ChannelController(this);
                this._channelControllerMap[channelInfo.identifier] = controller;
            }
            controller.update(channelInfo);
        });
        // remove obsolete channel controllers, add required new channel controllers
        _.difference(Array.from(_.keys(this._channelControllerMap)), this.info.channelSet.identifiers())
            .forEach((id : string) => {
                this._channelControllerMap[id].teardown();
                delete this._channelControllerMap[id];
            });
        this.updateChannelControllerSource();
    }

    protected updateChannelControllerSource() {
        //console.log(this.tag + ' update channel controller source ' + this._channelControllerMap.size);
        this._channelControllerSource.next(_.values(this._channelControllerMap));
    }

}


// ---------------------------------------------------------------------------------------------------------------------
// Message generator

export enum ComponentDriverFlow {
    INCOMING,
    OUTGOING
}

// message generator can have a default engine and overrides per parameter
// consider having an instance message generator being created/destroyed on the
// fly for multiple simultaneaous generators, or maybe better to allow the user to
// create multiple overlapping ComponentMessageGenerator. In time perhaps more
// complex generator types such as arpegiators could be created (although that
// maybe be a better fit for a channel processor)

export class ComponentDriver extends PeriodicDriver {

    private _channelSelection = new ChannelSelection(null, null);

    private _flow = ComponentDriverFlow.OUTGOING;
    private _defaultGeneratorType : ValueGeneratorType.CONSTANT;
    private _generators : IValueGeneratorMap = {}; // parameter identifier as key
    private _selectionSubscription : Rx.Subscription;
    private _currentInstance : string;
    private _instanceCycles = 10;

    private _channelController : ChannelController;

    private _generatorKeysSource = new Rx.BehaviorSubject<string[]>([]);
    private _generatorKeysObservable = this._generatorKeysSource.asObservable();

    //private _channelControllerSource = new Rx.BehaviorSubject<ChannelController>(null);
    //private _channelControllerObservable = this._channelControllerSource.asObservable();

    constructor(private _manager : ComponentManager) {
        super();
        // TODO: provide a clean way to unsubscribe, teardown/destroy kind of thing
        this._selectionSubscription = this._channelSelection.changeObservable.subscribe(() => {
            this._channelController = this.manager.getChannelController(this.channelSelection);
            this.updateGenerators();
        });
    }

    get flow() : ComponentDriverFlow { return this._flow; }

    set flow(flow : ComponentDriverFlow) { this._flow = flow; }

    get manager() : ComponentManager { return this._manager; }

    get channelSelection() : ChannelSelection { return this._channelSelection; }

    get channelController() : ChannelController { return this._channelController; }

    //get channelControllerObservable() : Rx.Observable<ChannelController> { return this._channelControllerObservable; }

    get generatorKeysObservable() : Rx.Observable<string[]> { return this._generatorKeysObservable; }

    getGenerator(key : string) : ValueGeneratorContainer {
        const result = this._generators[key] as ValueGeneratorContainer;
        if (!result) console.warn(this.tag + ' getGenerator failed ' + key);
        return result;
    }

    protected get generators() : IValueGeneratorMap { return this._generators; }

    protected drive(time : number, cycles : number) {
        if (this.channelController) {
            // if we have a multiple of instance cycles, create a new instance
            if (cycles % this._instanceCycles == 0) {
                // destroy current instance if it exists
                if (this._currentInstance) {
                    this.sendMessage(HubMessageType.Destroy, this._currentInstance, this.generateParameters(time, cycles));
                }
                // create an instance
                this._currentInstance = GUID.generate();
                this.sendMessage(HubMessageType.Create, this._currentInstance, this.generateParameters(time, cycles));
            }
            this.sendMessage(HubMessageType.Control, this._currentInstance, this.generateParameters(time, cycles));
        } else {
            console.error(this.tag + ' could not generate message, no channel controller');
        }
    }

    protected updateGenerators() {
        // we want to keep previous generators, don't clear...
        this._generators = {};
        if (this.channelController) {
            console.log(this.tag + ' updating generators ('
                + this.channelController.info.parameters.length + ' parameters)');
            this.channelController.info.parameters.forEach((parameterInfo : ParameterInfo) => {
                // single value parameter samples for now
                if (!this.generators[parameterInfo.identifier]) {
                    this.generators[parameterInfo.identifier] =
                        new ValueGeneratorContainer(this._defaultGeneratorType);
                }
            });
        } else {
            console.error(this.tag + ' cannot update generators, no channel controller');
        }
        const keys = _.keys(this.generators);
        console.log(this.tag + ' updating generator keys source with : ' + keys.join(', '));
        this._generatorKeysSource.next(keys);
    }

    protected generateParameters(time : number, cycles : number) : Parameters {
        const parameters = new Parameters();
        this.channelController.info.parameters.forEach((parameterInfo : ParameterInfo) => {
            // single value parameter samples for now, for some reason .get() doesn't work
            //const generator = this.generators.get(parameterInfo.identifier);
            const generator = this.generators[parameterInfo.identifier];
            if (generator) {
                parameters.setParameter(parameterInfo.identifier, [generator.generate(time, cycles)])
            } else {
                console.error(this.tag + ' no generator for parameter ' + parameterInfo.identifier);
            }
        });
        return parameters;
    }

    protected sendMessage(messageType : HubMessageType, instance : string, parameters : Parameters) {
        const ContentClass = HubMessage.contentClass(messageType);
        if (ContentClass) {
            const content = new ContentClass (
                this.channelSelection.componentSelection.identifier,
                this.channelSelection.identifier,
                instance,
                null,
                parameters
            );
            const message = new HubMessage(messageType, null, content);
            if (this.flow == ComponentDriverFlow.INCOMING) {
                //console.log(this.tag + ' generated incoming message ' + message.type);
                this.channelController.processIncomingMessage(message);
            } else if (this.flow == ComponentDriverFlow.OUTGOING) {
                //console.log(this.tag + ' generated outgoing message ' + message.type);
                this.channelController.sendOutgoingMessage(message);
            }
        } else {
            console.error(this.tag + ' no content class for hub message type : '
                + HubMessageType[messageType]);
        }
    }

}



// ---------------------------------------------------------------------------------------------------------------------
// Note, allows multiple component declarations per connection (keyed by identifier).
// Cannot have duplicate component identifiers

export interface IComponentControllerMap extends IStringTMap<ComponentController> { }

export class ComponentManager extends NativeClass implements IComponentSelectionValidator  {

    private _componentControllerMap : IComponentControllerMap = {};
    private _componentControllerSource = new Rx.BehaviorSubject<ComponentController[]>([]);
    private _componentControllersObservable = this._componentControllerSource.asObservable();

    constructor() {
        super();
        this.updateComponentControllerSource();
    }

    //observable with the controller array subscribers will get the latest versions, useful for UI
    get componentControllersObservable() : Rx.Observable<ComponentController[]> {
        return this._componentControllersObservable;
    }

    get componentControllers() : ComponentController[] {
        return this._componentControllerSource.getValue();
    }

    updateComponents(connection : IConnection, infoList : ComponentInfo[]) {
        const updatedIdentifiers : string[] = infoList.map((info) => { return info.identifier; });
        const currentIdentifiers : string[] =  this.getComponentControllers(connection).map((controller) => {
            return controller.info.identifier;
        });
        // returns the values from the first array that are not present in the other arrays
        _.difference(currentIdentifiers, updatedIdentifiers).forEach((identifier) => {
            // delete obsolete identifiers
            this.internalUnregisterComponent(connection, identifier);
        });
        infoList.forEach((info : ComponentInfo) => {
            this.internalRegisterComponent(connection, info);
        });
        this.updateComponentControllerSource();
    }

    // call register to associate component info with a connection,
    // note there can be multiple components per connection
    registerComponent(connection : IConnection, info : ComponentInfo) {
        this.internalRegisterComponent(connection, info);
        this.updateComponentControllerSource();
    }
    // in order to unregister a component, you must know its associated connection
    unregisterComponent(connection : IConnection, identifier : string) {
        this.internalUnregisterComponent(connection, identifier);
        this.updateComponentControllerSource();
    }
    // call clean whenever a connection ends
    clean(connection : IConnection) {
        // get component identifiers for this connection
        this.getComponentControllers(connection).map((component : ComponentController) => {
            return component.info.identifier;
        }).forEach((identifier : string) => {
            this.unregisterComponent(connection, identifier);
        });
        this.updateComponentControllerSource();
    }

    // clear all registered controllers
    reset() {
        this._componentControllerMap = {};
        this.updateComponentControllerSource();
    }

    // validate a component selection
    validateComponentSelection(selection : ComponentSelection) : boolean {
        const result =  _.has(this._componentControllerMap, selection.identifier);
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

    // get component or channel controllers based on selections
    getComponentController(selection : ComponentSelection) : ComponentController {
        return this._componentControllerMap[selection.identifier];
    }
    getComponentControllers(connection : IConnection) : ComponentController[] {
        return _.values(this._componentControllerMap).filter((controller : ComponentController) => {
            return controller.connection === connection
        });
    }
    getChannelController(selection : ChannelSelection) {
        const componentController = this.getComponentController(selection.componentSelection);
        return componentController ? componentController.getChannelController(selection) : null;
    }

    // call register to associate component info with a connection, note there can be multiple components per connection
    private internalRegisterComponent(connection : IConnection, info : ComponentInfo) {
        if (!(info && info.identifier)) throw new Error('invalid identifier');
        let componentController = this._componentControllerMap[info.identifier];
        if (componentController) {
            console.log(this.tag + ' updating component ' + info.identifier);
            if (componentController.connection !== connection)
                throw new Error('duplicate component declaration');
        } else {
            console.log(this.tag + ' registering component ' + info.identifier);
            componentController = new ComponentController(connection);
            this._componentControllerMap[info.identifier] = componentController;
        }
        componentController.update(info);
    }
    // in order to unregister a component, you must know its associated connection
    private internalUnregisterComponent(connection : IConnection, identifier : string) {
        let componentController = this._componentControllerMap[identifier];
        if (!componentController)
            throw new Error('unknown component identifier : ' + identifier);
        if (componentController.connection !== connection)
            throw new Error('component ' + identifier + ' is not associated with connection');
        delete this._componentControllerMap[identifier];
    }

    private updateComponentControllerSource() {
        //console.log(this.tag + ' update component controller source ' + this._componentControllerMap.size);
        this._componentControllerSource.next(_.values(this._componentControllerMap));
    }

}

