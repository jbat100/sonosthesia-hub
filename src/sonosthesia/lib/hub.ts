
import * as Q from "q";

import {NativeClass, IConnector, IConnection} from "./core";
import {HubConfiguration, ConnectorType} from './configuration';
import {ComponentManager} from "./component";
import {HubMessage, HubMessageContentParser} from "./messaging";
import {TCPConnector} from "./connector";
import {GeneratorManager} from "./generator";
import {MappingManager} from "./mapping";


export class HubManager extends NativeClass {

    private _connector : IConnector;
    private _connections = new Map<string, IConnection>();
    private _subscriptions = new Map<string, Rx.Disposable>();

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
    get connector() { return this._connector; }

    public setup() : Q.Promise<void> {
        return Q().then(() => {

            return this.setupConnector();

        });
    }

    public teardown() : Q.Promise<void> {
        return Q().then(() => {

            return this.connector.stop().then(() => {
                this._subscriptions.forEach((subscription : Rx.Disposable) => { subscription.dispose(); });
                this._subscriptions.clear();
                this._connections.clear();
            });

        });
    }

    private setupConnector() : Q.Promise<void> {
        return Q().then(() => {

            const parser = new HubMessageContentParser();

            if (this.configuration.connectorType == ConnectorType.TCP) {
                this._connector = new TCPConnector(parser);
            } else {
                throw new Error('unsupported connector type');
            }

            this.connector.emitter.on('connection', (connection : IConnection) => {
                this.setupConnection(connection);
            });

            this.connector.emitter.on('disconnection', (connection : IConnection) => {
                this.teardownConnection(connection);
            });

            return this.connector.start(this.configuration.port).then(() => {
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
