

import { Injectable } from '@angular/core';

import {
    ScaleValueOperator, OffsetValueOperator, ParameterOperator
} from "../sonosthesia/lib/processing";


@Injectable()
export class ParameterOperatorService {

    // // http://stackoverflow.com/questions/12802317/passing-class-as-parameter-causes-is-not-newable-error

    readonly tag = 'ParameterOperatorService';

    readonly operatorTypes : (typeof ParameterOperator)[] = [
        ScaleValueOperator,
        OffsetValueOperator
    ];

    operatorNames() : string[] {
        return this.operatorTypes.map((operatorType : typeof ParameterOperator) => {
            return operatorType.operatorName as string;
        });
    }

    operatorTypeForName(name : string) : typeof ParameterOperator {
        return this.operatorTypes.find((operatorType : typeof ParameterOperator) => {
            return operatorType.operatorName == name;
        });
    }

}
