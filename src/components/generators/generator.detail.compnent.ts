

import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input
} from '@angular/core';

import {
    ComponentController, ChannelController, ComponentInfo, ComponentMessageGenerator
} from "../../sonosthesia/lib/component";


@Component({
    selector: 'generator-detail',
    templateUrl: 'generator.detail.html'
})
export class GeneratorDetailComponent implements OnInit, OnDestroy {

    readonly tag = 'GeneratorDetailComponent';

    @Input()
    generator : ComponentMessageGenerator;


    ngOnInit() {

    }

    ngOnDestroy() {

    }

}