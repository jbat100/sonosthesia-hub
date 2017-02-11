

import {Component} from '@angular/core';


@Component({
    selector: 'menu',
    templateUrl: 'views/menu.html'
})
export class MenuComponent {

    readonly tag = 'MenuComponent';

    identifier:string;

    heartbeat:number;

    
}