
import * as Rx from 'rxjs/Rx';

import {
    Component, Input, Output, EventEmitter
} from '@angular/core';

import {ParameterOperator} from "../../sonosthesia/lib/processing";

@Component({
    selector: 'parameter-operator',
    templateUrl: 'parameter.operator.html'
})
export class ParameterOperatorComponent {

    readonly tag = 'ParameterOperatorComponent';

    @Output()
    deleteRequest = new EventEmitter();

    @Input()
    parameterOperator : ParameterOperator;


}