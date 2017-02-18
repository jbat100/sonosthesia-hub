
import {Component, Input, OnInit} from '@angular/core';
import {Router} from "@angular/router";

import {NgbTabChangeEvent} from '@ng-bootstrap/ng-bootstrap';

// https://toddmotto.com/transclusion-in-angular-2-with-ng-content

@Component({
    selector: 'navigation',
    templateUrl: 'navigation.html'
})
export class NavigationComponent implements OnInit {

    readonly tag = 'NavigationComponent';

    @Input()
    public currentKey : string;

    readonly tabs = [
        { key:'generators' },
        { key:'settings' }
    ];

    activeIndex : number;

    constructor(private _router : Router) {

    }

    ngOnInit() {

        this.activeIndex = -1;

        this.tabs.forEach((tab : any, index : number) => {
            if (tab.key === this.currentKey) {
                tab.active = true;
                this.activeIndex = index;
            } else {
                tab.active = false;
            }

        });

    }

    public tabChange($event: NgbTabChangeEvent) {
        console.info(this.tag + ' tab changed ' + $event.nextId);
        this.navigate($event.nextId);
    }

    private navigate(key : string) {
        console.info(this.tag + ' navigation switching with key ' + key);
        const path : string = '/' + key;
        console.info(this.tag + ' navigating to path ' + path);
        this._router.navigate([path]).then(() => {
            console.info(this.tag + ' navigation done');
        });
    }

}
