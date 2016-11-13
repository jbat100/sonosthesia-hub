'use strict';

const _ = require('underscore');
const expect = require('chai').expect;

const NativeClass = require('./core').NativeClass;


/**
 * Multi-dimensional
 */
class ParameterSample extends NativeClass {
    contructor(values, date) {
        expect(values).to.be.instanceof(Array);
        _.each(values, value => { expect(value).to.be.a('number') });
        this._values = values;
        if (!date) date = new Date();
        expect(date).to.be.instanceof(Date);
        this._date = date;
    }
    get values() { return this._values; }
    get date() { return this._date; }
}


/**
 * Operator
 */
class ParameterOperator extends NativeClass {

    static get name() { return ''; }

    constructor() {
        super();
        this._memory = 0;
    }

    get memory() { return this._memory; }

    set memory(memory) {
        expect(memory).to.be.a('number');
        this._memory = memory;
    }

    process(sample, pastInputs, pastOutputs) {
        throw new Error('not implemented');
    }
}

/**
 * Value Operator operates on single values, maps each values in input array to output array, array length is preserved
 * Subclasses should override _processValue
 */

class ValueOperator extends NativeClass {

    process(sample, pastInputs, pastOutputs) {
        return _.map(_.zip(sample, pastInputs, pastOutputs), zipped => {
            return this._processValue.apply(this, zipped);
        });
    }

    _processValue(sample, pastInputs, pastOutputs) {
        throw new Error('not implemented');
    }

}

/**
 * Array Operator operates on arrays, maps an input array to an output array, array length can change
 * Subclasses should override _processArray
 */

class ArrayOperator extends NativeClass {

    process(sample, pastInputs, pastOutputs) {
        return this._processArray.apply(this, zipped);
    }

    _processArray(sample, pastInputs, pastOutputs) {
        throw new Error('not implemented');
    }

}


/**
 * A processor is a concrete instantiation of an operator which tracks past inputs and outputs
 */

class ParameterProcessor extends NativeClass {

    constructor(operator) {
        expect(operator).to.be.instanceof(ParameterOperator);
        this._operator = operator;
        this._pastInputs = [];
        this._pastOutputs = [];
    }

    get operator() { return this._operator; }

    process(sample) {
        expect(sample).to.be.instanceof(ParameterSample);
        const processed = this.operator(sample, this._pastInputs, this._pastOutputs);
        expect(processed).to.be.instanceof(ParameterSample);
        if (this.operator.memory > 0) {
            this._pastInputs.unshift(sample);
            this._pastOutputs.unshift(processed);
            // http://stackoverflow.com/questions/953071/how-to-easily-truncate-an-array-with-javascript
            // setting length seems to work and is more efficient than slice
            if (this._pastInputs.length > this.operator.memory) this._pastInputs.length = this.operator.memory;
            if (this._pastOutputs.length > this.operator.memory) this._pastOutputs.length = this.operator.memory;
        }
        return output;
    }
}

class ParameterProcessorChain extends NativeClass {

    constructor(operators) {
        this._processors = _.map(operators, operator => { return new ParameterProcessor(operator); });
    }

    process(sample) {
        expect(sample).to.be.instanceof(ParameterSample);
        _.each(this._processors, processor => { sample = processor.process(sample); });
        return sample;
    }

}
