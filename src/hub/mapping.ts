
import * as _ from "underscore";
import * as Q from "q";
import {expect} from "chai";

import { NativeClass, Selection } from '../core/core'


const ParameterOperator = require('./parameter').ParameterOperator;
const ParameterProcessor = require('./parameter').ParameterProcessor;
const ParameterProcessorChain = require('./parameter').ParameterProcessorChain;

const ChannelFlow = require('./component').ChannelFlow;

const ComponentInfo = require('./component').ComponentInfo;
const ChannelInfo = require('./component').ChannelInfo;
const ParameterInfo = require('./component').ParameterInfo;

const ComponentSelection = require('./component').ComponentSelection;
const ChannelSelection = require('./component').ChannelSelection;
const ParameterSelection = require('./component').ParameterSelection;


class ParameterConnection extends NativeClass {

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


class ChannelConnection extends NativeClass {

    constructor() {
        this._input = new ChannelSelection();
        this._output = new ChannelSelection();
        this._routes = [];
    }

    get input() { return this._input; }

    get output() { return this._output; }

    process(input) {

    }

}

class MappingManager extends NativeClass {

    constructor() {

    }

}