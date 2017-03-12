

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

    constructor(private _hubService : HubService) {

    }

    ngOnInit() {
        this.subscription = this._hubService.hubManager.subscribe((hubManager : HubManager) => {
            this.componentControllers = hubManager.componentManager.componentControllers;
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.subscription = null;
        this.componentControllers = null;
    }
}