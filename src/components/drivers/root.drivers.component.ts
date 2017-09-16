
import * as Rx from 'rxjs/Rx';

import {Component, NgZone, OnInit, OnDestroy} from '@angular/core';

import { HubService } from "../../services/hub.service";

import { IDriver } from "../../sonosthesia/lib/driver";
import { HubManager } from "../../sonosthesia/lib/hub";
import { ComponentDriver } from "../../sonosthesia/lib/component";


@Component({
    selector: 'root-drivers',
    templateUrl: 'root.drivers.html'
})
export class RootDriversComponent implements OnInit, OnDestroy {

    readonly tag = 'RootDriversComponent';

    driversObservable : Rx.Observable<IDriver[]>;

    // filtered generatorsObservable
    componentDriverObservable : Rx.Observable<ComponentDriver[]>;

    private _subscription : Rx.Subscription;
    private _hubManager : HubManager;

    constructor(private _zone : NgZone, private _hubService : HubService) {
        console.log(this.tag + ' constructor');
    }

    ngOnInit() {
        console.log(this.tag + ' ngOnInit');
        this._subscription = this._hubService.hubManager.subscribe((hubManager : HubManager) => {
            this._hubManager = hubManager;
            if (this._hubManager) {
                this._zone.run(() => {
                    // main generator observable with all the drivers
                    this.driversObservable = this._hubManager.driverManager.elementsObservable;
                    // mapped observable with only the component message drivers left in the array, consider making this
                    // a utility
                    this.reloadDrivers();
                });
            } else {
                this.driversObservable = null;
                this.componentDriverObservable = null;
            }
        });
    }

    ngOnDestroy() {
        if (this._subscription) this._subscription.unsubscribe();
    }

    onCreateDriver() {
        //console.log(this.tag + ' onCreateGenerator');
        if (this._hubManager) {
            const driver = new ComponentDriver(1000, this._hubManager.componentManager);
            this._hubManager.driverManager.appendElement(driver);
        }
    }

    onDestroyDriver(index : number) {
        if (this._hubManager) {
            this._hubManager.driverManager.removeElement(index);
        }
    }

    private reloadDrivers() {
        if (this.driversObservable) {
            this.componentDriverObservable = this.driversObservable.map((drivers : IDriver[]) => {
                //console.log(this.tag + ' generator observable fired');
                // map and filter the actual array received by the observable
                const result = Array.from(drivers).map((driver : IDriver) => {
                    return driver as ComponentDriver;
                }).filter((driver : ComponentDriver) => {
                    return driver != null;
                }) as ComponentDriver[];
                //console.log(this.tag + ' got ' + result.length + ' drivers');
                return result;
            });
        }
    }

}