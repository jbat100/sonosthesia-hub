
import * as Rx from 'rxjs/Rx';

import {Component, NgZone, OnInit, OnDestroy, AfterViewInit} from '@angular/core';

import { HubService } from "../../services/hub.service";

import { IGenerator } from "../../sonosthesia/lib/generator";
import { HubManager } from "../../sonosthesia/lib/hub";
import { ComponentMessageGenerator } from "../../sonosthesia/lib/component";
import { ListIterator } from "../../sonosthesia/lib/core";


@Component({
    selector: 'root-generators',
    templateUrl: 'root.generators.html'
})
export class RootGeneratorsComponent implements OnInit, OnDestroy, AfterViewInit {

    readonly tag = 'RootGeneratorsComponent';

    generatorsObservable : Rx.Observable<IGenerator[]>;

    // filtered generatorsObservable
    componentMessageGeneratorsObservable : Rx.Observable<ComponentMessageGenerator[]>;

    private _subscription : Rx.Subscription;
    private _hubManager : HubManager;

    constructor(private _zone : NgZone, private _hubService : HubService) {
        console.log(this.tag + ' constructor');
    }

    ngOnInit() {
        console.log(this.tag + ' ngOnInit');
        this._subscription = this._hubService.hubManager.subscribe((hubManager : HubManager) => {
            this._hubManager = hubManager;
            if (this._hubManager) {
                this._zone.run(() => {
                    // main generator observable with all the generators
                    this.generatorsObservable = this._hubManager.generatorManager.elementsObservable;
                    // mapped observable with only the component message generators left in the array, consider making this
                    // a utility
                    this.reloadGenerators();
                });
            } else {
                this.generatorsObservable = null;
                this.componentMessageGeneratorsObservable = null;
            }
        });
    }

    ngAfterViewInit() {
        //this.reloadGenerators();
    }

    ngOnDestroy() {
        if (this._subscription) this._subscription.unsubscribe();
    }

    onCreate() {
        console.log(this.tag + ' onCreate');
        if (this._hubManager) {
            const generator = new ComponentMessageGenerator(1000, this._hubManager.componentManager);
            this._hubManager.generatorManager.appendElement(generator);
        }
    }

    private reloadGenerators() {
        if (this.generatorsObservable) {
            this.componentMessageGeneratorsObservable = this.generatorsObservable.map((generators : IGenerator[]) => {
                console.log(this.tag + ' generator observable fired');
                // map and filter the actual array received by the observable
                const result = Array.from(generators).map((generator : IGenerator) => {
                    return generator as ComponentMessageGenerator;
                }).filter((generator : ComponentMessageGenerator) => {
                    return generator != null;
                }) as ComponentMessageGenerator[];
                console.log(this.tag + ' got ' + result.length + ' generators');
                return result;
            });
        }
    }

}