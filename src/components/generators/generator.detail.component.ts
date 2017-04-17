

import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, Input, Output, EventEmitter
} from '@angular/core';

import {
    ComponentMessageGenerator, ComponentMessageGeneratorFlow
} from "../../sonosthesia/lib/component";

import { GeneratorState } from "../../sonosthesia/lib/generator";


@Component({
    selector: 'generator-detail',
    templateUrl: 'generator.detail.html'
})
export class GeneratorDetailComponent implements OnInit {

    readonly tag = 'GeneratorDetailComponent';

    @Output()
    deleteRequest = new EventEmitter();

    @Input()
    generator : ComponentMessageGenerator;

    runningObservable : Rx.Observable<boolean>;

    flowEnumType = ComponentMessageGeneratorFlow;

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

    onSelectedFlow(key : number) {
        console.log(this.tag + ' selected flow ' + key);
        this.generator.flow = key as ComponentMessageGeneratorFlow;
    }

}