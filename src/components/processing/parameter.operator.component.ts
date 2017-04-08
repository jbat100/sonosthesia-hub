
import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input
} from '@angular/core';

import {ParameterOperator} from "../../sonosthesia/lib/processing";

@Component({
    selector: 'parameter-operator',
    templateUrl: 'parameter.operator.html'
})
export class ParameterOperatorComponent implements OnInit, OnDestroy {

    readonly tag = 'ParameterOperatorComponent';

    @Input()
    parameterOperator : ParameterOperator;

    ngOnInit() {

    }

    ngOnDestroy() {

    }

}