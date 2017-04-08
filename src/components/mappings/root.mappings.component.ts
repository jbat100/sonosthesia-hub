
import * as Rx from 'rxjs/Rx';

import {Component, NgZone, OnInit, OnDestroy} from '@angular/core';
import {ChannelMapping} from "../../sonosthesia/lib/mapping";
import {HubManager} from "../../sonosthesia/lib/hub";
import {HubService} from "../../services/hub.service";
import {ListIterator} from "../../sonosthesia/lib/core";


@Component({
    selector: 'root-mappings',
    templateUrl: 'root.mappings.html'
})
export class RootMappingsComponent implements OnInit, OnDestroy {

    readonly tag = 'RootMappingsComponent';

    mappingsObservable : Rx.Observable<ListIterator<ChannelMapping>>;

    private _subscription : Rx.Subscription;
    private _hubManager : HubManager;

    constructor(private _zone : NgZone, private _hubService : HubService) {
        console.log(this.tag + ' constructor');
    }

    ngOnInit() {
        //console.log(this.tag + ' ngOnInit');
        this._subscription = this._hubService.hubManager.subscribe((hubManager : HubManager) => {
            this._hubManager = hubManager;
            if (this._hubManager) {
                this._zone.run(() => {
                    this.mappingsObservable = this._hubManager.mappingManager.elementsObservable;
                });
            } else {
                this.mappingsObservable = null;
            }
        });
    }

    ngOnDestroy() {
        if (this._subscription) this._subscription.unsubscribe();
    }

    onCreate() {
        console.log(this.tag + ' onCreate');
        if (this._hubManager) {
            const mapping = new ChannelMapping(this._hubManager.mappingManager, this._hubManager.componentManager);
            this._hubManager.mappingManager.appendElement(mapping);
        }
    }

}