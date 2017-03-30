
import * as Q from 'q';

import * as Rx from 'rxjs/Rx';

import { Injectable } from '@angular/core';
import { ConfigurationService } from './configuration.service';

import {
    HubManager, HubConfiguration, FileUtils, ComponentInfo, LocalConnection,
    HubMessageContentParser
} from '../sonosthesia';

// simple angular service to offer an entry point to a sonosthesia hub manager instance

@Injectable()
export class HubService {

    readonly tag = 'HubService';

    // we want the hub manager to be a behaviour so that wa can make it available when async setup is done
    private _hubManagerSource = new Rx.BehaviorSubject<HubManager>(null);
    private _hubManager = this._hubManagerSource.asObservable();

    private _done = false;

    // component config paths will be loaded to the hubManager's manager
    private _componentConfigPaths = [
        'F:/Sonosthesia/sonosthesia-hub/config/local.component.json'
    ];

    private _localConnection = new LocalConnection(new HubMessageContentParser());

    constructor(private _configurationService: ConfigurationService) {

        //console.log(this.tag + ' __dirname' + __dirname);

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
                            }).catch(err => {
                                console.error(this.tag + ' failed to load component config file ' + path + ', err : ' + err.stack);
                            });
                        })
                    );
                }).then(() => {
                    // broadcast to observable subscribers
                    console.warn(this.tag + ' hub manager created');
                    this._hubManagerSource.next(manager);
                }).catch(err => {
                    console.error(this.tag + ' hub manager creation error : ' + err);
                });
            } else {
                console.error('configuration observable infoObservable when hub manager is already created');
            }
        }, err => {
            console.error('configuration observable err ' + err);
        });

    }

    get hubManager() : Rx.Observable<HubManager> { return this._hubManager; }


}