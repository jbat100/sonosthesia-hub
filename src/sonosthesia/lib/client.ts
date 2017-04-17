
import {Socket} from 'net';

import * as Q from 'q';

import {NativeClass, IConnection} from "./core";
import {TCPConnection} from "./connector";
import {HubMessageContentParser} from "./messaging";
import {ComponentController, ComponentInfo} from "./component";

export class Client extends NativeClass {

    private _componentControllers : ComponentController[];

    constructor(private _connection : IConnection) {
        super();
    }

    get connection() : IConnection { return this._connection; }

    // call with updated info if the compnent has changed
    registerComponent(info : ComponentInfo) {
        let controller = this._componentControllers.find((candidate : ComponentController) => {
            return candidate.info.identifier == info.identifier;
        });
        // if the controller does not exist yet then create it
        if (!controller) controller = new ComponentController(this.connection);
        controller.update(info);
    }

    unregisterComponent(identifier : string) {
        const index = this._componentControllers.findIndex((candidate : ComponentController) => {
            return candidate.info.identifier == identifier;
        });
        if (index >= 0) this._componentControllers.splice(index, 1);
    }

    // send an update to the server with all component info
    sendComponentInfo() {

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