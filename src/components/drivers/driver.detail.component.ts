

import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, Input, Output, EventEmitter
} from '@angular/core';

import {
    ComponentDriver, ComponentDriverFlow
} from "../../sonosthesia/lib/component";

import { DriverState } from "../../sonosthesia/lib/driver";


@Component({
    selector: 'driver-detail',
    templateUrl: 'driver.detail.html'
})
export class DriverDetailComponent implements OnInit {

    readonly tag = 'DriverDetailComponent';

    @Output()
    deleteRequest = new EventEmitter();

    @Input()
    driver : ComponentDriver;

    runningObservable : Rx.Observable<boolean>;

    flowEnumType = ComponentDriverFlow;

    ngOnInit() {
        this.runningObservable = this.driver.stateObservable.map((state : DriverState) => {
            return state === DriverState.RUNNING;
        });
    }

    onStart(event) {
        event.preventDefault();
        this.driver.start();
    }

    onStop(event) {
        event.preventDefault();
        this.driver.stop();
    }

    onSelectedFlow(key : number) {
        console.log(this.tag + ' selected flow ' + key);
        this.driver.flow = key as ComponentDriverFlow;
    }

}