
import { NativeClass } from './core';


export enum ConnectorType {
    UNDEFINED,
    TCP,
    WS,
    SIO
}

export interface ConnectorConfiguration  {
    connectorType : ConnectorType;
    enabled : boolean;
    port : number;
}

export class HubConfiguration extends NativeClass {

    public connectorConfigurations : ConnectorConfiguration[] = [];

    static newFromJSON(obj) {

    }

}