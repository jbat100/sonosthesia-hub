

import { NativeClass } from './core';

import { ParameterOperator, ParameterProcessor, ParameterProcessorChain } from './parameter';
import { ComponentManager, ChannelSelection, ParameterSelection } from './component';



export class ParameterConnection extends NativeClass {

    private _input : ParameterSelection;
    private _output : ParameterSelection;
    private _operators : ParameterOperator[];

    constructor() {
        super();
        this._input = new ParameterSelection(null, null, null);
        this._output = new ParameterSelection(null, null, null);
        this._operators = [];
    }

    get operators() { return this._operators; }

    get input() { return this._input; }

    get output() { return this._output; }

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
}


export class ChannelConnection extends NativeClass {

    private _input : ChannelSelection;
    private _output : ChannelSelection;
    private _parameterConnections : ParameterConnection[];

    constructor() {
        super();
        this._input = new ChannelSelection(null, null);
        this._output = new ChannelSelection(null, null);
        this._parameterConnections = [];
    }

    get input() : ChannelSelection { return this._input; }

    get output() : ChannelSelection { return this._output; }

    process(input) {

    }

}

export class MappingManager extends NativeClass {

    constructor(private _componentManager : ComponentManager) {
        super();
    }

}