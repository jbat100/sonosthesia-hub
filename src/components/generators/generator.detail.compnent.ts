

import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, Input
} from '@angular/core';

import {ComponentMessageGenerator, ComponentManager} from "../../sonosthesia/lib/component";

import { GeneratorState } from "../../sonosthesia/lib/generator";


@Component({
    selector: 'generator-detail',
    templateUrl: 'generator.detail.html'
})
export class GeneratorDetailComponent implements OnInit {

    readonly tag = 'GeneratorDetailComponent';

    @Input()
    generator : ComponentMessageGenerator;

    runningObservable : Rx.Observable<boolean>;

    ngOnInit() {
        this.runningObservable = this.generator.stateObservable.map((state : GeneratorState) => {
            return state === GeneratorState.RUNNING;
        });
    }

    onStart(event) {
        event.preventDefault();
        this.generator.start();
    }

    onStop(event) {
        event.preventDefault();
        this.generator.stop();
    }

}