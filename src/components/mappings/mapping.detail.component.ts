
import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input
} from '@angular/core';

import { ParameterOperatorService } from "../../services/operator.service";

import { ChannelMapping, ParameterMapping } from "../../sonosthesia/lib/mapping";
import { ParameterOperator } from "../../sonosthesia/lib/processing";


@Component({
    selector: 'channel-mapping',
    templateUrl: 'channel-mapping.html'
})
export class ChannelMappingComponent implements OnInit {

    readonly tag = 'ChannelMappingComponent';

    @Input()
    channelMapping : ChannelMapping;

    parameterMappings : Rx.Observable<ParameterMapping[]>;

    ngOnInit() {
        if (this.channelMapping) {
            this.parameterMappings = this.channelMapping.parameterMappingManager.elementsObservable;
        }
    }

    onCreateParameterMapping() {
        // autoselect sensible parameter input/output selection for the new component
        const parameterMapping = new ParameterMapping(this.channelMapping);
        this.channelMapping.parameterMappingManager.appendElement(parameterMapping);
    }

    onDestroyParameterMapping(index : number) {
        this.channelMapping.parameterMappingManager.removeElement(index);
    }

}

@Component({
    selector: 'parameter-mapping',
    templateUrl: 'parameter.mapping.html'
})
export class ParameterMappingComponent implements OnInit {

    readonly tag = 'ParameterMappingComponent';

    @Input()
    parameterMapping : ParameterMapping;

    parameterOperators : Rx.Observable<ParameterOperator[]>;

    availableOperatorNames : string[];

    constructor(private _operatorService : ParameterOperatorService) { }

    ngOnInit() {

        // http://stackoverflow.com/questions/12802317/passing-class-as-parameter-causes-is-not-newable-error

        this.availableOperatorNames = this._operatorService.operatorNames();

        if (this.parameterMapping) {
            this.parameterOperators = this.parameterMapping.operatorManager.elementsObservable;
        }
    }

    onCreateParameterOperator(name : string) {
        const operatorType : typeof ParameterOperator = this._operatorService.operatorTypeForName(name);
        if (operatorType) {
            const operator = new operatorType();
            this.parameterMapping.operatorManager.appendElement(operator);

        } else {
            console.error(this.tag + ' no operator type for name ' + name);
        }
    }

    onDestroyParameterOperator(index : number) {
        this.parameterMapping.operatorManager.removeElement(index);
    }

}