
import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input, NgZone
} from '@angular/core';

import {
    ComponentManager, ComponentSelection, ChannelSelection, ParameterSelection, ComponentController
} from "../../sonosthesia/lib/component";

import {HubService} from "../../services/hub.service";
import {HubManager} from "../../sonosthesia/lib/hub";


@Component({
    selector: 'component-selection',
    templateUrl: 'component.selection.html'
})
export class ComponentSelectionComponent implements OnInit, OnDestroy {

    readonly tag = 'ComponentSelectionComponent';

    @Input()
    selection : ComponentSelection;

    // component manager is used to validate selection and provide available options
    private componentManager : ComponentManager;
    private componentControllersObservable : Rx.Observable<ComponentController[]>;

    constructor(private _zone : NgZone, private _hubService : HubService) {
        this._hubService.hubManager.subscribe((hubManager : HubManager) => {
            if (hubManager) {
                this._zone.run(() => {
                    this.componentManager = hubManager.componentManager;
                    this.componentControllersObservable = this.componentManager.componentControllersObservable;
                });
            } else {
                this.componentManager = null;
                this.componentControllersObservable = null;
            }
        });
    }

    ngOnInit() {
        this.selection.changeObservable.subscribe(() => { this.refreshIdentifiers(); });
    }

    ngOnDestroy() {

    }

    private refreshIdentifiers() {

    }

}