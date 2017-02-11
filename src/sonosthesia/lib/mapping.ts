

import { NativeClass } from './core';

import { ParameterOperator, ParameterProcessor, ParameterProcessorChain } from './parameter';
import { ChannelFlow, ComponentInfo, ChannelInfo, ParameterInfo } from './component';
import { ComponentSelection, ChannelSelection, ParameterSelection } from './component';



export class ParameterConnection extends NativeClass {

    private _input : ParameterSelection;
    private _output : ParameterSelection;
    private _operators : ParameterOperator[];

    constructor() {
        super();
        this._input = new ParameterSelection();
        this._output = new ParameterSelection();
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
        this._input = new ChannelSelection();
        this._output = new ChannelSelection();
        this._parameterConnections = [];
    }

    get input() { return this._input; }

    get output() { return this._output; }

    process(input) {

    }

}

export class MappingManager extends NativeClass {

    constructor() {
        super();
    }

}