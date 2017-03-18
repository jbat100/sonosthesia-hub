

import * as Rx from 'rxjs/Rx';

import {Component, OnInit, OnDestroy} from '@angular/core';

import { HubService } from '../../services/hub.service';
import { ComponentController } from "../../sonosthesia/lib/component";
import { HubManager } from "../../sonosthesia/lib/hub";


@Component({
    selector: 'root-components',
    templateUrl: 'root.components.html'
})
export class RootComponentsComponent implements OnInit, OnDestroy {

    readonly tag = 'RootComponentsComponent';

    subscription : Rx.Subscription;

    componentControllers : Rx.Observable<ComponentController[]>;

    testList = ['bla', 'bli', 'blo'];

    constructor(private _hubService : HubService) {
        console.log(this.tag + ' constructor');
    }

    ngOnInit() {
        console.log(this.tag + ' ngOnInit');
        this.subscription = this._hubService.hubManager.subscribe((hubManager : HubManager) => {
            const count = hubManager.componentManager.componentControllers.length;
            console.log(this.tag + ' ngOnInit got hub manager with ' + count + ' component controllers');
            this.componentControllers = hubManager.componentManager.componentControllersObservable;
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.subscription = null;
        this.componentControllers = null;
    }
}