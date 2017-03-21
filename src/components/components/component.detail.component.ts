
import * as Rx from 'rxjs/Rx';

import {
    Component, OnInit, OnDestroy, Input
} from '@angular/core';

import {
    ComponentController, ChannelController, ComponentInfo, ChannelInfo,
    ParameterInfo
} from "../../sonosthesia/lib/component";


@Component({
    selector: 'component-detail',
    templateUrl: 'component.detail.html'
})
export class ComponentDetailComponent implements OnInit, OnDestroy {

    readonly tag = 'ComponentDetailComponent';

    // https://angular.io/docs/ts/latest/cookbook/component-communication.html
    @Input()
    set componentController(componentController : ComponentController) {
        this._componentController = componentController;
        this.linkComponentController(this.componentController);
    }
    get componentController() : ComponentController { return this._componentController; }

    // components can update their channels on the fly (by sending a new component description message)
    // using an observable allows to react to changes easily

    channelControllers : ChannelController[];
    componentInfo : ComponentInfo;

    private _componentController : ComponentController;
    private _controllerSubscription : Rx.Subscription;
    private _infoSubscription : Rx.Subscription;

    ngOnInit() {
        this.linkComponentController(this.componentController);
    }

    ngOnDestroy() {
        this.linkComponentController(null);
    }

    private linkComponentController(componentController : ComponentController) {

        //console.log(this.tag + ' linkComponentController : ' + componentController);

        this.channelControllers = null;
        this.componentInfo = null;

        if (this._controllerSubscription) {
            this._controllerSubscription.unsubscribe();
            this._controllerSubscription = null;
        }

        if (this._infoSubscription) {
            this._infoSubscription.unsubscribe();
            this._infoSubscription = null;
        }

        if (componentController) {
            this._controllerSubscription = componentController.channelControllersObservable
                .subscribe((controllers : ChannelController[]) => {
                //console.log(this.tag + ' channel controllers subscription update with ' + controllers.length + ' controllers');
                this.channelControllers = controllers;
            }, err => {
                console.error(this.tag + ' channel controllers subscription error : ' + err);
            });
            this._infoSubscription = componentController.infoObservable
                .subscribe((info : ComponentInfo) => {
                this.componentInfo = info;
            });
        }
    }

}

@Component({
    selector: 'channel-detail',
    templateUrl: 'channel.detail.html'
})
export class ChannelDetailComponent implements OnInit, OnDestroy {

    readonly tag = 'ChannelDetailComponent';

    // https://angular.io/docs/ts/latest/cookbook/component-communication.html
    @Input()
    set channelController(channelController : ChannelController) {
        this._channelController = channelController;
        this.linkChannelController(this.channelController);
    }
    get channelController() : ChannelController { return this._channelController; }

    channelInfo : ChannelInfo;

    private _channelController : ChannelController;

    ngOnInit() {
        this.linkChannelController(this.channelController);
    }

    ngOnDestroy() {
        this.linkChannelController(null);
    }

    private linkChannelController(channelController : ChannelController) {
        this.channelInfo = null;
        if (channelController) {
            this.channelController.infoObservable.subscribe((info : ChannelInfo) => {
                this.channelInfo = info;
            });
        }
    }
}

@Component({
    selector: 'parameter-detail',
    templateUrl: 'parameter.detail.html'
})
export class ParameterDetailComponent {

    readonly tag = 'ParameterDetailComponent';

    @Input()
    parameterInfo : ParameterInfo;

}