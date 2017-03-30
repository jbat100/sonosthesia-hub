
import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input, NgZone
} from '@angular/core';

import {
    ComponentManager, ComponentSelection, ChannelSelection, ParameterSelection, ComponentController, ChannelController,
    ChannelInfo, ComponentInfo, ParameterInfo
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

    // component manager is used to validate selection and provide available options, is not meant to change

    @Input()
    manager : ComponentManager;

    identifier : string;
    candidates : string[];


    // subscriptions
    private subscription : Rx.Subscription;

    // selection validity can be observed with async pipe on selection.validObservable

    constructor(private _zone : NgZone) { }

    ngOnInit() {
        this.subscription = this.manager.componentControllersObservable.subscribe((controllers : ComponentController[]) => {
            this._zone.run(() => {
                this.candidates = controllers.map((controller: ComponentController) => { return controller.info.identifier; });
                if (this.identifier && this.candidates.indexOf(this.identifier) == -1) { this.identifier = null; }
            });
        });
    }

    ngOnDestroy() {
        if (this.subscription) this.subscription.unsubscribe();
    }

    // http://stackoverflow.com/questions/33700266/how-can-i-get-new-selection-in-select-in-angular-2

    onSelection(selected : string) {
        console.log(this.tag + ' selected : ' + selected);
        this.selection.identifier = selected;
        this.manager.validateComponentSelection(this.selection);
    }

}

@Component({
    selector: 'channel-selection',
    templateUrl: 'channel.selection.html'
})
export class ChannelSelectionComponent implements OnInit, OnDestroy {

    readonly tag = 'ChannelSelectionComponent';

    @Input()
    manager : ComponentManager;

    @Input()
    selection : ChannelSelection;

    componentController : ComponentController;

    identifier : string;
    candidates : string[];

    private componentControllerSubscription : Rx.Subscription;
    private componentSelectionSubscription : Rx.Subscription;
    private componentInfoSubscription : Rx.Subscription;

    // selection validity can be observed with async pipe on selection.validObservable

    constructor(private _zone : NgZone) { }

    ngOnInit() {
        // refresh candidates when the component controllers array is changed
        this.componentControllerSubscription = this.manager.componentControllersObservable.subscribe((controllers : ComponentController[]) => {
            this._zone.run(() => { this.relink(); });
        });
        // refresh candidates when the component selection of the channel selection is changed
        this.componentSelectionSubscription = this.selection.componentSelection.changeObservable.subscribe(() => {
            this._zone.run(() => { this.relink(); });
        });
    }

    ngOnDestroy() {
        if (this.componentControllerSubscription) this.componentControllerSubscription.unsubscribe();
        if (this.componentSelectionSubscription) this.componentSelectionSubscription.unsubscribe();
        if (this.componentInfoSubscription) this.componentInfoSubscription.unsubscribe();
    }


    private relink() {
        this.componentController = this.manager.getComponentController(this.selection.componentSelection);
        if (this.componentInfoSubscription) this.componentInfoSubscription.unsubscribe();
        if (this.componentController) {
            this.componentInfoSubscription = this.componentController.infoObservable.subscribe((componentInfo : ComponentInfo) => {
                this._zone.run(() => {
                    this.candidates = componentInfo.channels.map((channelInfo : ChannelInfo) => { return channelInfo.identifier; });
                    if (this.identifier && this.candidates.indexOf(this.identifier) == -1) { this.identifier = null; }
                });
            });
        }
    }

    // http://stackoverflow.com/questions/33700266/how-can-i-get-new-selection-in-select-in-angular-2

    onSelection(selected : string) {
        console.log(this.tag + ' selected : ' + selected);
        this.selection.identifier = selected;
        this.manager.validateChannelSelection(this.selection);
    }

}


@Component({
    selector: 'parameter-selection',
    templateUrl: 'parameter.selection.html'
})
export class ParameterSelectionComponent implements OnDestroy {

    readonly tag = 'ParameterSelectionComponent';

    @Input()
    manager : ComponentManager;

    @Input()
    selection : ParameterSelection;

    componentController : ComponentController;

    identifier : string;
    candidates : string[];

    private componentControllerSubscription : Rx.Subscription;
    private componentInfoSubscription : Rx.Subscription;
    private channelSelectionSubscription : Rx.Subscription;

    // selection validity can be observed with async pipe on selection.validObservable

    constructor(private _zone : NgZone) { }

    ngOnInit() {
        // refresh candidates when the component controllers array is changed
        this.componentControllerSubscription = this.manager.componentControllersObservable.subscribe((controllers : ComponentController[]) => {
            this._zone.run(() => { this.relinkComponent(); });
        });
        // refresh candidates when the component or channel selection of the parameter selection is changed
        this.channelSelectionSubscription = this.selection.channelSelection.changeObservable.subscribe(() => {
            this._zone.run(() => { this.relinkComponent(); });
        });
    }

    ngOnDestroy() {
        if (this.componentControllerSubscription) this.componentControllerSubscription.unsubscribe();
        if (this.componentInfoSubscription) this.componentInfoSubscription.unsubscribe();
        if (this.channelSelectionSubscription) this.channelSelectionSubscription.unsubscribe();
    }


    private relinkComponent() {
        this.componentController = this.manager.getComponentController(this.selection.channelSelection.componentSelection);
        // note that info is not expected to be set at a granularity below component level (channel or parameter)
        if (this.componentInfoSubscription) this.componentInfoSubscription.unsubscribe();
        if (this.componentController) {
            this.componentInfoSubscription = this.componentController.infoObservable.subscribe((componentInfo : ComponentInfo) => {
                this._zone.run(() => {
                    const channelInfo : ChannelInfo = componentInfo.channelSet.getElement(this.selection.channelSelection.identifier);
                    this.candidates = this.candidates = channelInfo.parameters.map((parameterInfo : ParameterInfo) => { return parameterInfo.identifier; });
                    if (this.identifier && this.candidates.indexOf(this.identifier) == -1) { this.identifier = null; }
                });
            });
        }
    }

    // http://stackoverflow.com/questions/33700266/how-can-i-get-new-selection-in-select-in-angular-2

    onSelection(selected : string) {
        console.log(this.tag + ' selected : ' + selected);
        this.selection.identifier = selected;
        this.manager.validateParameterSelection(this.selection);
    }

}