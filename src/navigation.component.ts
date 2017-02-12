
import {Component, Input, OnInit} from '@angular/core';
import {Router} from "@angular/router";



// https://toddmotto.com/transclusion-in-angular-2-with-ng-content

@Component({
    selector: 'navigation',
    templateUrl: 'navigation.html'
})
export class NavigationComponent implements OnInit {

    readonly tag = 'NavigationComponent';

    @Input()
    currentKey : string;

    readonly tabs = [
        { key:'generators' },
        { key:'settings' }
    ];

    activeIndex : number;

    constructor(_router : Router) {

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

    navigate(key : string) {
        console.info(this.tag + ' navigation switching with key ' + key);
        $location.path(key);
    }

};
