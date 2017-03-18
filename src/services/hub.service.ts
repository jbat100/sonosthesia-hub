
import * as Q from 'q';

import { Injectable } from '@angular/core';
import { ConfigurationService } from './configuration.service';

import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {
    HubManager, HubConfiguration, FileUtils, ComponentInfo, LocalConnection,
    HubMessageContentParser
} from '../sonosthesia';

// simple angular service to offer an entry point to a sonosthesia hub manager instance

@Injectable()
export class HubService {

    readonly tag = 'HubService';

    // we want the hub manager to be a behaviour so that wa can make it available when async setup is done
    private _hubManagerSource = new BehaviorSubject<HubManager>(null);
    private _hubManager = this._hubManagerSource.asObservable();

    private _done = false;

    // component config paths will be loaded to the hubManager's componentManager
    private _componentConfigPaths = [
        '../../config/local.component.json'
    ];

    private _localConnection = new LocalConnection(new HubMessageContentParser());

    constructor(private _configurationService: ConfigurationService) {

        this._configurationService.configuration.subscribe((configuration : HubConfiguration) => {
            if (!this._done) {
                this._done = true;
                const manager = new HubManager(configuration);
                // we only want the service to be available when the setup is done
                manager.setup().then(() => {
                    // load local component config file
                    return Q.all(
                        this._componentConfigPaths.map(path => {
                            return FileUtils.readJSONFile(path).then((obj : any) => {
                                const componentInfo = ComponentInfo.newFromJSON(obj) as ComponentInfo;
                                manager.componentManager.registerComponent(this._localConnection, componentInfo);
                            });
                        })
                    );
                }).then(() => {
                    // bradcast to observable subscribers
                    this._hubManagerSource.next(manager);
                }).catch(err => {
                    console.error(this.tag + ' hub manager creation error : ' + err);
                });
            } else {
                console.error("configuration observable updated when hub manager is already created");
            }
        });

    }

    get hubManager() : Observable<HubManager> { return this._hubManager; }


}