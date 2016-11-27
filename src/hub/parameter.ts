
import * as _ from "underscore";
import {expect} from "chai";

import { NativeClass } from '../core/core'

/**
 * Multi-dimensional
 */

export class ParameterSample extends NativeClass {

    private _timestamp : number = Date.now();

    constructor(private _values : number[], private _timestamp? : number ) {
        if (!this.timestamp) this._timestamp = Date.now();
    }

    get values() : number[] { return this._values; }

    get timestamp() : number { return this._timestamp; }
}


/**
 * Operator
 */

export class ParameterOperator extends NativeClass {

    static get name() { return ''; }

}

export class StatelessParameterOperator extends ParameterOperator {

    process(sample : ParameterSample) : ParameterSample {
        throw new Error('not implemented');
    }
}

/**
 * Value Operator operates on single values, maps each values in input array to output array, array length is preserved
 * Subclasses should override _processValue
 */

class StatelessValueOperator extends StatelessParameterOperator {

    process(sample : ParameterSample) : ParameterSample {
        const values : number[] = _.map(sample.values, value => { return this._processValue(value); });
        return new ParameterSample(values, sample.timestamp);
    }

    _processValue( value : number ) : number {
        throw new Error('not implemented');
    }

}

/**
 * Array Operator operates on arrays, maps an input array to an output array, array length can change
 * Subclasses should override _processArray
 */

class StatelessArrayOperator extends StatelessParameterOperator {

    process(sample : ParameterSample) : ParameterSample {
        const values : number[] = this._processArray(sample.values);
        return new ParameterSample(values, sample.timestamp);
    }

    _processArray(values : number[]) : number[] {
        throw new Error('not implemented');
    }

}

export class StatefulParameterOperator extends ParameterOperator {

    constructor(private _inputMemory: number, private _outputMemory: number) { }

    get inputMemory() : number { return this._inputMemory; }

    get outputMemory() : number { return this._outputMemory; }

    process(sample : ParameterSample, pastInputs : ParameterSample[], pastOutputs : ParameterSample[]) {
        throw new Error('not implemented');
    }
}



class ParameterProcessorFactory extends NativeClass {

    static newProcessorWithOperator(operator : ParameterOperator) {
        if (operator.constructor === StatelessArrayOperator) {
            return new StatelessParameterProcessor(operator as StatelessArrayOperator);
        } else if (operator.constructor === StatefulArrayOperator) {
            return new StatefulParameterProcessor(operator as StatefulArrayOperator);
        } else {
            throw new Error('unsuported operator');
        }
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

class StatelessParameterProcessor extends ParameterProcessor {

}

class StatefulParameterProcessor extends ParameterProcessor {

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
