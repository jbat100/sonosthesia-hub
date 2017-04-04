
import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input
} from '@angular/core';

import { ChannelMapping, MappingManager } from "../../sonosthesia/lib/mapping";

import { GeneratorState } from "../../sonosthesia/lib/generator";


@Component({
    selector: 'channel-mapping-detail',
    templateUrl: 'channel-mapping.detail.html'
})
export class ChannelMappingComponent implements OnInit, OnDestroy {

    readonly tag = 'GeneratorDetailComponent';

    @Input()
    mapping : ChannelMapping;

    ngOnInit() {

    }

    ngOnDestroy() {

    }

}