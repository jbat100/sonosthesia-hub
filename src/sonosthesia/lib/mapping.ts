
import * as Rx from 'rxjs/Rx';

import {NativeClass, ListManager} from './core';

import { ParameterSample, ParameterOperator, ParameterProcessorChain } from './processing';
import { ComponentManager, ChannelSelection, ParameterSelection, ChannelController } from './component';
import { HubMessage, HubMessageType, Parameters, ChannelMessageContent } from "./messaging";

// ---------------------------------------------------------------------------------------------------------------------
// Mapper actually carries out the mapping process for a given parameter mapping for a given channel or instance

export class Mapper extends NativeClass {

    private _processorChain : ParameterProcessorChain;

    constructor(private _operatorManager : ParameterOperatorManager) {
        super();
        this._processorChain = new ParameterProcessorChain(this._operatorManager.elements);
    }

    get operatorManager() : ParameterOperatorManager { return this._operatorManager; }

    get processorChain() : ParameterProcessorChain { return this._processorChain; }

    reset() {
        this.reload(this._operatorManager);
    }

    reload(operatorManager : ParameterOperatorManager) {
        this._operatorManager = operatorManager;
        this._processorChain = new ParameterProcessorChain(this.operatorManager.elements);
    }

    process(sample : ParameterSample) : ParameterSample {
        return this.processorChain.process(sample);
    }

}

export class ParameterOperatorManager extends ListManager<ParameterOperator> { }

export class ParameterMapping extends NativeClass {

    private _input : ParameterSelection;
    private _output : ParameterSelection;
    private _operatorManager = new ParameterOperatorManager();

    private _staticMapper = new Mapper(null);
    private _instanceMappers = new Map<string, Mapper>();

    constructor() {
        super();
        this._input = new ParameterSelection(null, null, null);
        this._output = new ParameterSelection(null, null, null);
    }

    get operatorManager() : ParameterOperatorManager { return this._operatorManager; }

    get input() { return this._input; }

    get output() { return this._output; }

    createInstanceMapper(instance : string) {
        this._instanceMappers[instance] = new Mapper(this.operatorManager);
    }

    destroyInstanceMapper(instance : string) {
        this._instanceMappers.delete(instance);
    }

    process(sample : ParameterSample, instance : string) : ParameterSample {
        if (instance) {
            const mapper = this._instanceMappers.get(instance);
            if (mapper) {
                return mapper.process(sample);
            } else {
                throw new Error('invalid instance ' + instance);
            }
        } else {
            return this._staticMapper.process(sample);
        }
    }

    reset() {
        this._staticMapper.reset();
        this._instanceMappers.forEach((mapper) => { mapper.reset(); });
        this._instanceMappers.clear();
    }

    // reload with the current parameter mapping operators
    reload() {
        this._staticMapper.reload(this.operatorManager);
        this._instanceMappers.forEach((mapper) => { mapper.reload(this.operatorManager); });
    }
}


export class ParameterMappingManager extends ListManager<ParameterMapping> { }

export class ChannelMapping extends NativeClass {

    private _input : ChannelSelection;
    private _output : ChannelSelection;

    private _parameterMappingManager = new ParameterMappingManager();

    private _inputController : ChannelController;
    private _outputController : ChannelController;

    private _inputSubscription : Rx.Subscription;

    // TODO implement automap (pass parameters with the same identifier through with identity mapping)
    private _automap : boolean = false;

    constructor(private _mappingManager : MappingManager, private _componentManager : ComponentManager) {
        super();
        this._input = new ChannelSelection(null, null);
        this._output = new ChannelSelection(null, null);
    }

    get componentManager() : ComponentManager { return this._componentManager; }

    get parameterMappingManager() : ParameterMappingManager { return this._parameterMappingManager; }

    get input() : ChannelSelection { return this._input; }

    get output() : ChannelSelection { return this._output; }

    set input(selection : ChannelSelection) {
        this._input = selection;
        this.reload();
    }

    set output(selection : ChannelSelection) {
        this._output = selection;
        this.reload();
    }

    // call reload when the input/output selection changes
    reload() {

        // update controllers for input and output channel selections

        this._inputController = this.componentManager.getChannelController(this.input);
        this._outputController = this.componentManager.getChannelController(this.output);

        if (this._inputSubscription) {
            this._inputSubscription.unsubscribe();
            this._inputSubscription = null;
        }

        if (this._inputController) {
            this._inputSubscription = this._inputController.messageObservable.subscribe((message : HubMessage) => {
                this.process(message);
            });
        }

    }

    process(message : HubMessage) {

        // first check message is addressed to the correct component channel

        const content = message.content as ChannelMessageContent;

        if (!content)
            throw new Error('expected message content');
        if (content.component !== this._input.componentSelection.identifier)
            throw new Error('unexpected component');
        if (content.channel !== this._input.identifier)
            throw new Error('unexpected channel');

        const instance : string = message.content.instance;

        if (message.hubMessageType == HubMessageType.Create && instance) {
            for (let parameterMapping of this.parameterMappingManager.elementIterator) {
                parameterMapping.createInstanceMapper(instance);
            }
        }

        if (this._outputController) {

            // message should be coming from subscription to input channel so it should be a channel related

            const parameters : Parameters = message.content.parameters;
            const timestamp : number = message.timestamp;
            const mappedParameters : Parameters = new Parameters();
            for (let parameterMapping of this.parameterMappingManager.elementIterator) {
                const values = parameters.getParameter(parameterMapping.input.identifier);
                const sample = new ParameterSample(values, timestamp);
                const processed = parameterMapping.process(sample, instance);
                mappedParameters.setParameter(parameterMapping.output.identifier, processed.values);
            }

            const content = message.content as ChannelMessageContent;
            const mappedContent = new (content.constructor as typeof ChannelMessageContent) (
                this._output.componentSelection.identifier,
                this._output.identifier,
                content.instance,
                null,
                mappedParameters
            );

            const mappedMessage = new HubMessage(message.hubMessageType, message.timestamp, mappedContent);

            this._outputController.sendMessage(mappedMessage);

        }

        if (message.hubMessageType == HubMessageType.Destroy && instance) {
            for (let parameterMapping of this.parameterMappingManager.elementIterator) {
                parameterMapping.destroyInstanceMapper(instance);
            }
        }

    }


}

export class MappingManager extends ListManager<ChannelMapping> {


}