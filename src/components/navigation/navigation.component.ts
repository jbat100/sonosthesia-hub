
import {Component, Input, OnInit} from '@angular/core';
import {Router} from "@angular/router";

import {NgbTabChangeEvent} from '@ng-bootstrap/ng-bootstrap';

import {NavigationService} from "../../services/navigation.service";

// https://toddmotto.com/transclusion-in-angular-2-with-ng-content


const targets = [
    { key:'components' },
    { key:'generators' },
    { key:'mappings' },
    { key:'settings' }
];

// the tab navigation is transclusion based

@Component({
    selector: 'navigation',
    templateUrl: 'tab.navigation.html'
})
export class TabNavigationComponent implements OnInit {

    readonly tag = 'TabNavigationComponent';

    @Input()
    public currentKey : string;

    readonly tabs = targets;

    activeIndex : number;

    constructor(private _router : Router, private _navigationService : NavigationService) { }

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
        this._navigationService.navigate($event.nextId, this._router);
    }

}

// deciding against the transclusion approach as it makes things awkward when mixing generics with specifics

@Component({
    selector: 'button-navigation',
    templateUrl: 'button.navigation.html'
})
export class ButtonNavigationComponent implements OnInit {

    readonly tag = 'ButtonNavigationComponent';

    @Input()
    public currentKey : string;

    keys = [];

    model = {};

    constructor(private _router : Router, private _navigationService : NavigationService) { }

    ngOnInit() {
        // oooo map with side effects, i'm bad...
        this.keys = targets.map((target : any) => {
            this.model[target.key] = target.key == this.currentKey;
            return target.key; })
        ;
    }

    onChange(key, state) {
        console.log(this.tag + ' onChange ' + key + ' ' + state);
        if (state) this._navigationService.navigate(key, this._router);
    }

}