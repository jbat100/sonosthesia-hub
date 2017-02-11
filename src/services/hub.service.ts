

import { Injectable } from '@angular/core';
import { ConfigurationService } from './configuration.service';

import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import { HubManager, HubConfiguration } from '../sonosthesia';

// simple angular service to offer an entry point to a sonosthesia hub manager instance

@Injectable()
export class HubService {

    readonly tag = 'HubService';

    // we want the hub manager to be a behaviour so that wa can make it available when async setup is done
    private _hubManagerSource = new BehaviorSubject<HubManager>(null);
    private _hubManager = this._hubManagerSource.asObservable();

    private _done = false;

    constructor(private _configurationService: ConfigurationService) {

        this._configurationService.configuration.subscribe((configuration : HubConfiguration) => {
            if (!this._done) {
                this._done = true;
                const manager = new HubManager(configuration);
                // we only want the service to be available when the setup is done
                manager.setup().then(() => { this._hubManagerSource.next(manager); })
            } else {
                console.error("configuration observable updated when hub manager is already created");
            }
        });

    }

    get hubManager() : Observable<HubManager> { return this._hubManager; }


}