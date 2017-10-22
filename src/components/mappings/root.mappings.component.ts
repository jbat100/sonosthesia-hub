
import * as Rx from 'rxjs/Rx';

import {Component, NgZone, OnInit, OnDestroy} from '@angular/core';
import {ChannelMapping} from "../../sonosthesia/lib/mapping";
import {HubManager} from "../../sonosthesia/lib/hub";
import {HubService} from "../../services/hub.service";


@Component({
    selector: 'root-mappings',
    templateUrl: 'root.mappings.html'
})
export class RootMappingsComponent implements OnInit, OnDestroy {

    readonly tag = 'RootMappingsComponent';

    mappingsObservable : Rx.Observable<ChannelMapping[]>;
    hubManager : HubManager;

    private _subscription : Rx.Subscription;


    constructor(private _zone : NgZone, private _hubService : HubService) {
        console.log(this.tag + ' constructor');
    }

    ngOnInit() {
        //console.log(this.tag + ' ngOnInit');
        this._subscription = this._hubService.hubManager.subscribe((hubManager : HubManager) => {
            this.hubManager = hubManager;
            this._zone.run(() => {
                if (this.hubManager) {
                    this.mappingsObservable = this.hubManager.mappingManager.elementsObservable;
                } else {
                    this.mappingsObservable = null;
                }
            });
        });
    }

    ngOnDestroy() {
        if (this._subscription) this._subscription.unsubscribe();
    }

    onCreate() {
        console.log(this.tag + ' onCreate');
        if (this.hubManager) {
            const mapping = new ChannelMapping(this.hubManager.mappingManager, this.hubManager.componentManager);
            this.hubManager.mappingManager.appendElement(mapping);
        }
    }

    onDelete(index : number) {
        console.log(this.tag + ' onDelete ' + index);
        if (this.hubManager) {
            this.hubManager.mappingManager.removeElement(index);
        }
    }

}