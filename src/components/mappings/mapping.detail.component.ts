
import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input
} from '@angular/core';

import { ChannelMapping, ParameterMapping } from "../../sonosthesia/lib/mapping";
import { ListIterator } from "../../sonosthesia/lib/core";
import { ParameterOperator } from "../../sonosthesia/lib/processing";


@Component({
    selector: 'channel-mapping',
    templateUrl: 'channel-mapping.html'
})
export class ChannelMappingComponent implements OnInit, OnDestroy {

    readonly tag = 'ChannelMappingComponent';

    @Input()
    channelMapping : ChannelMapping;

    parameterMappings : Rx.Observable<ListIterator<ParameterMapping>>;

    ngOnInit() {
        if (this.channelMapping) {
            this.parameterMappings = this.channelMapping.parameterMappingManager.elementsObservable;
        }
    }

    ngOnDestroy() {

    }

}

@Component({
    selector: 'parameter-mapping',
    templateUrl: 'parameter.mapping.html'
})
export class ParameterMappingComponent implements OnInit, OnDestroy {

    readonly tag = 'ParameterMappingComponent';

    @Input()
    parameterMapping : ParameterMapping;

    parameterOperators : Rx.Observable<ListIterator<ParameterOperator>>;

    ngOnInit() {
        if (this.parameterMapping) {
            this.parameterOperators = this.parameterMapping.operatorManager.elementsObservable;
        }
    }

    ngOnDestroy() {

    }

}