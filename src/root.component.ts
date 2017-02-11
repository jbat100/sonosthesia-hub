
import { Component } from '@angular/core';

import * as sonosthesia from './sonosthesia';

@Component({
    selector: 'root',
    templateUrl: 'views/root.html'
})
export class RootComponent {

    private message : sonosthesia.HubMessage;

}