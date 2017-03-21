

import * as Rx from 'rxjs/Rx';

import {NgZone, Component, OnInit, OnDestroy} from '@angular/core';

import { HubService } from '../../services/hub.service';

import {
    ComponentController, HubManager
} from "../../sonosthesia";


@Component({
    selector: 'root-components',
    templateUrl: 'root.components.html'
})
export class RootComponentsComponent implements OnInit, OnDestroy {

    readonly tag = 'RootComponentsComponent';

    subscription : Rx.Subscription;

    componentControllers : ComponentController[];

    testList = ['bla', 'bli', 'blo'];

    constructor(private _zone : NgZone, private _hubService : HubService) {
        console.log(this.tag + ' constructor');
        this.componentControllers = [];
    }

    ngOnInit() {
        //console.log(this.tag + ' ngOnInit');
        this.subscription = this._hubService.hubManager.subscribe((hubManager : HubManager) => {
            if (hubManager) {
                const count = hubManager.componentManager.componentControllers.length;
                console.warn(this.tag + ' ngOnInit got hub manager with ' + count + ' component controllers');
                //this.componentControllers = hubManager.componentManager.componentControllersObservable;
                // test
                hubManager.componentManager.componentControllersObservable.subscribe((controllers : ComponentController[]) => {
                    // https://angular.io/docs/ts/latest/api/core/index/NgZone-class.html, running without zone doesn't update
                    this._zone.run(() => { this.componentControllers = controllers; });
                    //console.log(this.tag + ' ngOnInit test subscription got ' + controllers.length + ' controllers');
                }, err => {
                    console.error(this.tag + ' component controllers subscription error ' + err);
                });
            } else {
                this.componentControllers = [];
                //console.warn(this.tag + ' ngOnInit got null hub manager');
            }

        }, err => {
            this.componentControllers = [];
            console.error(this.tag + ' hub manager subscription error ' + err);
        });
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
        this.subscription = null;
        this.componentControllers = [];
    }
}