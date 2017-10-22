
import * as Q from 'q';

import * as Rx from 'rxjs/Rx';

import { Injectable } from '@angular/core';
import { ConfigurationService } from './configuration.service';

// use explicit imports to help out webpack
import { HubManager  } from '../sonosthesia/lib/hub';
import { HubConfiguration } from '../sonosthesia/lib/configuration';
import { LocalConnection,  } from '../sonosthesia/lib/connector/core';
import { HubMessageContentParser } from '../sonosthesia/lib/messaging';
import { ComponentInfo } from '../sonosthesia/lib/component';

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
        'F:/Sonosthesia/sonosthesia-hub/config/test.component.1.json'
    ];

    private _localConnection = new LocalConnection(new HubMessageContentParser());

    constructor(private _configurationService: ConfigurationService) {
        console.log(this.tag + ' constructor');
    }

    get hubManager() : Rx.Observable<HubManager> {
      return this._hubManager;
    }

    init() {

        console.log(this.tag + ' init getting configuration');

        const info = new ComponentInfo();

        console.log(this.tag + ' ComponentInfo test');

        this._configurationService.configuration.subscribe((configuration : HubConfiguration) => {
            if (!this._done) {
                this._done = true;
                console.warn(this.tag + ' creating hub manager with configuration: ' + configuration);
                const manager = new HubManager(configuration);
                // we only want the service to be available when the setup is done
                console.warn(this.tag + ' hub manager setting up');
                manager.setup().then(() => {
                    // load local component config file
                    console.warn(this.tag + ' hub manager setup done');
                    return Q.all(
                        this._componentConfigPaths.map(path => {
                            return ComponentInfo.importFromFile(path).then((infoList : ComponentInfo[]) => {
                                infoList.forEach((info : ComponentInfo) => {
                                    console.warn(this.tag + ' imported component info ' + JSON.stringify(info));
                                    manager.componentManager.registerComponent(this._localConnection, info);
                                });
                            }).catch(err => {
                                console.error(this.tag + ' failed to load component config file '
                                    + path + ', err : ' + err.stack);
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


}
