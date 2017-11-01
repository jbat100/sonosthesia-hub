
import {Socket} from 'net';

import * as Q from 'q';
import * as _ from 'underscore';

import {NativeClass, IConnection} from "./core";
import {TCPConnection} from "./connector/tcp";
import {HubMessageContentParser, ComponentMessageContent, HubMessage, HubMessageType, Parameters} from "./messaging";
import {ComponentController, ComponentInfo, ChannelSelection} from "./component";

// lots of things here are very similar to the component manager, think of having the component manager creating
// a component for each connection

export class Client extends NativeClass {

    private _componentControllers : ComponentController[];

    constructor(private _connection : IConnection) {
        super();
    }

    get connection() : IConnection { return this._connection; }

    clearComponents() {
        this._componentControllers.forEach(controller => { controller.teardown(); });
        this._componentControllers = [];
        this.sendComponentInfo();
    }

    updateComponents(infoList : ComponentInfo[]) {
        const updatedIdentifiers : string[] = infoList.map((info) => { return info.identifier; });
        const currentIdentifiers : string[] =  this._componentControllers.map((controller) => {
            return controller.info.identifier;
        });
        // returns the values from the first array that are not present in the other arrays
        _.difference(currentIdentifiers, updatedIdentifiers).forEach((identifier) => {
            // delete obsolete identifiers
            this.internalUnregisterComponent(identifier);
        });
        infoList.forEach((info : ComponentInfo) => {
            this.internalRegisterComponent(info);
        });
        this.sendComponentInfo();
    }

    registerComponent(info : ComponentInfo) {
        this.internalRegisterComponent(info);
        this.sendComponentInfo();
    }

    unregisterComponent(identifier : string) {
        this.internalUnregisterComponent(identifier);
        this.sendComponentInfo();
    }

    // send an update to the server with all component info
    sendComponentInfo() {
        const infoList : ComponentInfo[] = this._componentControllers.map((controller) => {
            return controller.info;
        });
        const content = new ComponentMessageContent(infoList);
        const message = new HubMessage(HubMessageType.COMPONENT, null, content);
        console.log(this.tag + ' sending component info for ' + infoList.length + ' component(s)');
        this.connection.sendMessage(message);
    }

    getComponentController(identifier : string) {
        return this._componentControllers.find(controller => { return controller.info.identifier === identifier; });
    }

    validateChannelSelection(selection : ChannelSelection) : boolean {
        const componentController = this.getComponentController(selection.componentSelection.identifier);
        if (componentController) {
            return componentController.validateChannelSelection(selection)
        } else {
            return false;
        }
    }

    sendChannelMessage(selection : ChannelSelection, type : HubMessageType, instance : string, parameters : Parameters) {
        if (this.validateChannelSelection(selection)) {
            const message = HubMessage.newChannelMessage(
                type,
                selection.componentSelection.identifier,
                selection.identifier,
                instance,
                parameters
            );
            this.connection.sendMessage(message);
        } else {
            console.error(this.tag + ' could not send message, invalid channel selection');
        }
    }

    // call with updated info if the compnent has changed
    private internalRegisterComponent(info : ComponentInfo) {
        let controller = this._componentControllers.find((candidate : ComponentController) => {
            return candidate.info.identifier == info.identifier;
        });
        // if the controller does not exist yet then create it
        if (!controller) controller = new ComponentController(this.connection);
        controller.update(info);
    }

    private internalUnregisterComponent(identifier : string) {
        const index = this._componentControllers.findIndex((candidate : ComponentController) => {
            return candidate.info.identifier == identifier;
        });
        if (index >= 0) {
            this._componentControllers[index].teardown();
            this._componentControllers.splice(index, 1);
        }
    }

}

export class TCPClient extends Client {

    static newTCPClient(address: string, port : number) : Q.Promise<TCPClient> {
        const d = Q.defer<TCPClient>();
        const client = new Socket();
        const parser = new HubMessageContentParser();
        client.connect(port, address, () => {
            console.log('TCPClient connected to ' + address + ':' + port);
            const connection = new TCPConnection(parser, null, client);
            d.resolve(new TCPClient(connection));
        });
        return d.promise;
    }

    constructor(_connection : TCPConnection) {
        super(_connection);
    }


}