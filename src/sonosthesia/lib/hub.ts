
import * as Q from "q";

import {NativeClass, IConnector, IConnection} from "./core";
import {HubConfiguration, ConnectorType} from './configuration';
import {ComponentManager} from "./component";
import {HubMessage, HubMessageContentParser} from "./messaging";
import {TCPConnector, SIOConnector} from "./connector";
import {GeneratorManager} from "./generator";
import {MappingManager} from "./mapping";


export class HubManager extends NativeClass {

    private _connections = new Map<string, IConnection>();
    private _subscriptions = new Map<string, Rx.Disposable>();

    // connectors
    private _tcpConnector : TCPConnector;
    private _sioConnector : SIOConnector;

    // managers
    private _componentManager = new ComponentManager();
    private _generatorManager = new GeneratorManager();
    private _mappingManager = new MappingManager();

    constructor(private _configuration : HubConfiguration) {
        super();
    }

    get configuration() : HubConfiguration { return this._configuration; }
    get componentManager() : ComponentManager { return this._componentManager; }
    get generatorManager() : GeneratorManager { return this._generatorManager; }
    get mappingManager() : MappingManager { return this._mappingManager; }

    // connectors
    get tcpConnector() { return this._tcpConnector; }

    setup() : Q.Promise<void> {
        return Q().then(() => {
            return this.setupConnector();
        });
    }

    teardown() : Q.Promise<void> {
        return Q().then(() => {
            return this.tcpConnector.stop().then(() => {
                this._subscriptions.forEach((subscription : Rx.Disposable) => { subscription.dispose(); });
                this._subscriptions.clear();
                this._connections.clear();
            });
        });
    }

    reset() {
        this.componentManager.reset();
        this.generatorManager.reset();
        this.mappingManager.reset();
    }

    private setupConnector() : Q.Promise<void> {
        return Q().then(() => {

            const parser = new HubMessageContentParser();

            if (this.configuration.connectorType == ConnectorType.TCP) {
                this._tcpConnector = new TCPConnector(parser);
            } else {
                throw new Error('unsupported connector type');
            }

            this.tcpConnector.emitter.on('connection', (connection : IConnection) => {
                this.setupConnection(connection);
            });

            this.tcpConnector.emitter.on('disconnection', (connection : IConnection) => {
                this.teardownConnection(connection);
            });

            return this.tcpConnector.start(this.configuration.port).then(() => {
                console.log('Server started on port ' + this.configuration.port);
            }).catch(err => {
                console.error('Error : ' + err.stack);
            });

        });
    }

    // used to handle the setup of incoming connector connections, registration and message routing mostly
    private setupConnection(connection : IConnection) {
        this._connections[connection.identifier] = connection;
        this._subscriptions[connection.identifier] = connection.messageObservable.subscribe((message : HubMessage) => {
            this.processMessage(message);
        });
    }

    private teardownConnection(connection : IConnection) {
        if (this._subscriptions[connection.identifier])
            this._subscriptions[connection.identifier].dispose();
        this._subscriptions.delete(connection.identifier);
        this._connections.delete(connection.identifier);
    }

    protected processMessage(message : HubMessage) {
        console.log('processing hub message ' + JSON.stringify(message.toJSON()));
    }

}
