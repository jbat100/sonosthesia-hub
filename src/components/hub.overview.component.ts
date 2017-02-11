

import { Component } from '@angular/core';

import { HubManager } from '../sonosthesia';
import { HubService } from '../services/hub.service';

@Component({
    selector: 'hub-overview',
    templateUrl: '../views/hub-overview.html'
})
export class HubOverviewComponent {

    readonly tag = 'HubOverviewComponent';

    private _hubManager : HubManager;

	constructor(private _hubService:HubService) {
        this._hubService.hubManager.subscribe(hubManager => { this._hubManager = hubManager; });
	}


}