
import * as Rx from 'rxjs/Rx';

import {
    Component, Input, Output, EventEmitter
} from '@angular/core';

import {ParameterOperator, ScaleValueOperator, OffsetValueOperator} from "../../sonosthesia/lib/processing";

// ----------------------------------- CONTAINER ----------------------------------------

@Component({
    selector: 'parameter-operator-container',
    templateUrl: 'parameter.operator.container.html'
})
export class ParameterOperatorContainerComponent {

    readonly tag = 'ParameterOperatorContainerComponent';

    @Output()
    deleteRequest = new EventEmitter();

    @Input()
    operator : ParameterOperator;
}

// ----------------------------------- OPERATOR COMPNENTS ----------------------------------------

@Component({
    selector: 'scale-value-operator',
    templateUrl: 'scale.value.operator.html'
})
export class ScaleValueOperatorComponent {

    readonly tag = 'ScaleValueOperatorComponent';

    @Input()
    operator : ScaleValueOperator;
}

@Component({
    selector: 'offset-value-operator',
    templateUrl: 'offset.value.operator.html'
})
export class OffsetValueOperatorComponent {

    readonly tag = 'OffsetValueOperatorComponent';

    @Input()
    operator : OffsetValueOperator;
}