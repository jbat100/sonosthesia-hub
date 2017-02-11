
import { Injectable } from '@angular/core';

import {Observable} from 'rxjs/Observable';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';

import {HubConfiguration, ConnectorType} from '../sonosthesia';

@Injectable()
export class ConfigurationService {

    readonly tag = 'ConfigurationService';

    // configuration is available asynchronously (could require file reads, network access etc)
    private _configurationSource = new BehaviorSubject<HubConfiguration>(null);
    private _configuration = this._configurationSource.asObservable();

    constructor() {
        // TODO: move configuration to external file
        const config = new HubConfiguration();
        config.connectorType = ConnectorType.TCP;
        config.port = 3333;
        this._configurationSource.next(config);
    }

    get configuration() : Observable<HubConfiguration> { return this._configuration; }

    // RANDOM TESTS

    sayHello() {
        console.info('hello');
    }


}
