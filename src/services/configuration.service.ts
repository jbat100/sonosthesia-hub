
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

        config.connectorConfigurations = [
            {
                connectorType: ConnectorType.TCP,
                enabled: true,
                port: 3000
            },
            {
                connectorType: ConnectorType.SIO,
                enabled: false,
                port: 3001
            },
            {
                connectorType: ConnectorType.WS,
                enabled: true,
                port: 3002
            }
        ];

        this._configurationSource.next(config);
    }

    get configuration() : Observable<HubConfiguration> { return this._configuration; }

}
