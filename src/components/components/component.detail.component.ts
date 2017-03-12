
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
    channelControllers : Rx.Observable<ChannelController[]>;

    componentInfo : Rx.Observable<ComponentInfo>;

    private _componentController : ComponentController;

    ngOnInit() {
        this.linkComponentController(this.componentController);
    }

    ngOnDestroy() {
        this.linkComponentController(null);
    }

    private linkComponentController(componentController : ComponentController) {
        if (componentController) {
            this.channelControllers = componentController.channelControllers;
            this.componentInfo = componentController.updated;
        } else {
            this.channelControllers = null;
            this.componentInfo = null;
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

    channelInfo : Rx.Observable<ChannelInfo>;

    private _channelController : ChannelController;

    ngOnInit() {
        this.linkChannelController(this.channelController);
    }

    ngOnDestroy() {
        this.linkChannelController(null);
    }

    private linkChannelController(channelController : ChannelController) {
        if (!!channelController) {
            this.channelInfo = this.channelController.updated;
        } else {
            this.channelController = null;
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