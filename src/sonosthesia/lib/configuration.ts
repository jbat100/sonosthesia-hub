
import { NativeClass } from './core';


export enum ConnectorType {
    Undefined,
    TCP
}

export class HubConfiguration extends NativeClass {

    public connectorType : ConnectorType;
    public port : number;

    static newFromJSON(obj) {

    }



}