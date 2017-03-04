
import * as Rx from 'rxjs/Rx';

import { NativeClass } from './core';

import { ParameterSample, ParameterOperator, ParameterProcessorChain } from './processing';
import { ComponentManager, ChannelSelection, ParameterSelection, ChannelController } from './component';
import { HubMessage } from "./messaging";

// ---------------------------------------------------------------------------------------------------------------------
// Mapper actually carries out the mapping process for a given parameter mapping for a given channel or instance

export class Mapper extends NativeClass {

    private _processorChain : ParameterProcessorChain;

    constructor(private _operators : ParameterOperator[]) {
        super();
        this._processorChain = new ParameterProcessorChain(this._operators);
    }

    reset() {
        this.reload(this._operators);
    }

    reload(operators : ParameterOperator[]) {
        this._operators = operators;
        this._processorChain = new ParameterProcessorChain(this._operators);
    }

    process(sample : ParameterSample) : ParameterSample {
        return this._processorChain.process(sample);
    }

}


export class ParameterMapping extends NativeClass {

    private _input : ParameterSelection;
    private _output : ParameterSelection;
    private _operators : ParameterOperator[];

    private _staticMapper = new Mapper(null);
    private _instanceMappers = new Map<string, Mapper>();

    constructor() {
        super();
        this._input = new ParameterSelection(null, null, null);
        this._output = new ParameterSelection(null, null, null);
        this._operators = [];
    }

    get operators() { return this._operators; }

    get input() { return this._input; }

    get output() { return this._output; }

    createInstanceMapper(instance : string) {
        this._instanceMappers[instance] = new Mapper(this._operators)
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

    getOperator(index) {
        return this._operators[index];
    }

    addOperator(operator, index) {
        NativeClass.checkInstanceClass(operator, ParameterOperator);
        this._operators.splice(index, 0, operator);
    }

    removeOperator(index) {
        this._operators.splice(index, 1);
    }

    reset() {
        this._staticMapper.reset();
        this._instanceMappers.forEach((mapper) => { mapper.reset(); });
        this._instanceMappers.clear();
    }

    // reload with the current parameter mapping operators
    reload() {
        this._staticMapper.reload(this._operators);
        this._instanceMappers.forEach((mapper) => { mapper.reload(this._operators); });
    }
}


export class ChannelMapping extends NativeClass {

    private _input : ChannelSelection;
    private _output : ChannelSelection;
    private _parameterMappings : ParameterMapping[];

    private _inputController : ChannelController;
    private _outputController : ChannelController;

    private _inputSubscription : Rx.Subscription;

    constructor(private _manager : MappingManager) {
        super();
        this._input = new ChannelSelection(null, null);
        this._output = new ChannelSelection(null, null);
        this._parameterMappings = [];
    }

    get manager() : MappingManager { return this._manager; }

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

        this._inputController = this.manager.componentManager.getChannelController(this.input);
        this._outputController = this.manager.componentManager.getChannelController(this.output);

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

        if (this._outputController) {

            switch(message.type) {
                case Mess
            }

        }

    }

}

export class MappingManager extends NativeClass {

    constructor(private _componentManager : ComponentManager) {
        super();
    }

    get componentManager() { return this._componentManager; }

}