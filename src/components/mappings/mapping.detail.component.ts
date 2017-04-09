
import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input
} from '@angular/core';

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
        parameterMapping
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

    ngOnInit() {
        if (this.parameterMapping) {
            this.parameterOperators = this.parameterMapping.operatorManager.elementsObservable;
        }
    }

    onCreateParameterOperator() {

    }

}