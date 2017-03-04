
import * as _ from "underscore";

import { NativeClass } from './core';

/**
 * Multi-dimensional
 */

export class ParameterSample extends NativeClass {


    constructor(private _values : number[], private _timestamp : number = Date.now()) {
        super();
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

    constructor(private _inputMemory: number, private _outputMemory: number) {
        super();
    }

    get inputMemory() : number { return this._inputMemory; }

    get outputMemory() : number { return this._outputMemory; }

    process(sample : ParameterSample, pastInputs : ParameterSample[], pastOutputs : ParameterSample[]) : ParameterSample {
        throw new Error('not implemented');
    }
}


/**
 * A processor is a concrete instantiation of an operator which tracks past inputs and outputs
 */

export class ParameterProcessor extends NativeClass {

    constructor(private _operator : ParameterOperator) {
        super();
    }

    get operator() : ParameterOperator { return this._operator; }

    process(sample : ParameterSample) : ParameterSample {
        throw new Error('not implemented')
    }

}

export class StatelessParameterProcessor extends ParameterProcessor {

    process(sample : ParameterSample) : ParameterSample {
        const operator = this.operator as StatelessParameterOperator;
        return operator.process(sample);
    }

}

export class StatefulParameterProcessor extends ParameterProcessor {

    private _pastInputs : ParameterSample[];
    private _pastOutputs : ParameterSample[];

    constructor(operator : ParameterOperator) {
        super(operator);
        this._pastInputs = [];
        this._pastOutputs = [];
    }

    process(sample : ParameterSample) : ParameterSample {
        const operator : StatefulParameterOperator = this.operator as StatefulParameterOperator;
        const processed = operator.process(sample, this._pastInputs, this._pastOutputs);
        this._pastInputs.unshift(sample);
        this._pastOutputs.unshift(processed);
        // http://stackoverflow.com/questions/953071/how-to-easily-truncate-an-array-with-javascript
        // setting length seems to work and is more efficient than slice
        if (this._pastInputs.length > operator.inputMemory) this._pastInputs.length = operator.inputMemory;
        if (this._pastOutputs.length > operator.outputMemory) this._pastOutputs.length = operator.outputMemory;
        return processed;
    }

}

export class ParameterProcessorFactory extends NativeClass {

    static newProcessorWithOperator(operator : ParameterOperator) : ParameterProcessor {
        if (operator.constructor === StatelessArrayOperator) {
            return new StatelessParameterProcessor(operator);
        } else if (operator.constructor === StatefulParameterOperator) {
            return new StatefulParameterProcessor(operator);
        } else {
            throw new Error('unsupported operator');
        }
    }
}

export class ParameterProcessorChain extends NativeClass {

    private _processors : ParameterProcessor[];

    constructor(private _operators : ParameterOperator[]) {
        super();
        this._processors = _.map(this._operators, operator => {
            return ParameterProcessorFactory.newProcessorWithOperator(operator);
        });
    }

    process(sample : ParameterSample) : ParameterSample {
        _.each(this._processors, processor => { sample = processor.process(sample); });
        return sample;
    }

}
