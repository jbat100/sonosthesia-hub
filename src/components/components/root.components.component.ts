
import { Component } from '@angular/core';

import { HubService } from '../../services/hub.service';


@Component({
    selector: 'root-components',
    templateUrl: 'root.components.html'
})
export class RootComponentsComponent {

    readonly tag = 'RootComponentsComponent';



    constructor(private _hubService : HubService) {

    }

}