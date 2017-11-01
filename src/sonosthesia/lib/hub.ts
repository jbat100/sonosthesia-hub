
import * as Q from "q";
import * as Rx from 'rxjs/Rx';

import {NativeClass, IConnector, IConnection} from "./core";
import {HubConfiguration, ConnectorConfiguration, ConnectorType} from './configuration';
import {ComponentManager} from "./component";
import {HubMessage, HubMessageContentParser, HubMessageType, ComponentMessageContent} from "./messaging";
import {DriverManager} from "./driver";
import {MappingManager} from "./mapping";

import {TCPConnector} from "./connector/tcp";
import {WSConnector} from "./connector/ws";


export class HubManager extends NativeClass {

    private _connections = new Map<string, IConnection>();
    private _subscriptions = new Map<string, Rx.Subscription>();

    // connectors
    private _connectors : IConnector[];

    // managers
    private _componentManager = new ComponentManager();
    private _driverManager = new DriverManager();
    private _mappingManager = new MappingManager();

    private _parser = new HubMessageContentParser();

    constructor(private _configuration : HubConfiguration) {
        super();
    }

    get configuration() : HubConfiguration { return this._configuration; }
    get componentManager() : ComponentManager { return this._componentManager; }
    get driverManager() : DriverManager { return this._driverManager; }
    get mappingManager() : MappingManager { return this._mappingManager; }
    get parser() : HubMessageContentParser { return this._parser; }

    setup() : Q.Promise<void> {
        return Q().then(() => {
            return Q.all(this._configuration.connectorConfigurations.filter(configuration => {
                return configuration.enabled;
            }).map(configuration => {
                return this.setupConnector(configuration);
            })).then(results => {
                this._connectors = results;
            });
        });
    }

    teardown() : Q.Promise<void> {
        return Q().then(() => {
            this.reset();
            return Q.all(this._connectors.map(connector => {
                return connector.stop();
            })).then(() => {
                this._subscriptions.forEach((subscription : Rx.Subscription) => { subscription.unsubscribe(); });
                this._subscriptions.clear();
                this._connections.clear();
            });
        });
    }

    reset() {
        this.componentManager.reset();
        this.driverManager.reset();
        this.mappingManager.reset();
    }

    private setupConnector(config : ConnectorConfiguration) : Q.Promise<IConnector> {
        return Q().then(() => {
            if (!config.enabled) throw new Error('connection config is not enabled');
            console.log(this.tag + ' setting up connector with configuration : ' + JSON.stringify(config));
            let connector : IConnector = null;
            switch (config.connectorType) {
                case ConnectorType.TCP:
                    connector = new TCPConnector(this.parser);
                    break;
                case ConnectorType.WS:
                    connector = new WSConnector(this.parser);
                    break;
                case ConnectorType.SIO:
                    //connector = new SIOConnector(this.parser);
                    //break;
                default:
                    throw new Error('unsupported connection type');
            }
            connector.emitter.on('connection', (connection : IConnection) => {
                this.setupConnection(connection);
            });
            connector.emitter.on('disconnection', (connection : IConnection) => {
                this.teardownConnection(connection);
            });
            return connector.start(config).then(() => {
                console.log('Server started on port ' + config.port);
                return connector;
            }).catch(err => {
                console.error('Error : ' + err.stack);
                throw err;
            });
        });
    }

    // used to handle the setup of incoming connector connections, registration and message routing mostly
    private setupConnection(connection : IConnection) {
        this._connections[connection.identifier] = connection;
        this._subscriptions[connection.identifier] = connection.messageObservable.subscribe((message : HubMessage) => {
            this.processMessage(connection, message);
        });
    }

    private teardownConnection(connection : IConnection) {
        if (this._subscriptions[connection.identifier])
            this._subscriptions[connection.identifier].unsubscribe();

        this.componentManager.clean(connection);

        this._subscriptions.delete(connection.identifier);
        this._connections.delete(connection.identifier);
    }

    protected processMessage(connection : IConnection, message : HubMessage) {
        console.log('processing hub message ' + JSON.stringify(message.toJSON()));

        switch (message.hubMessageType) {
            case HubMessageType.COMPONENT:
                {
                    const content = message.content as ComponentMessageContent;
                    this.componentManager.updateComponents(connection, content.components);
                }
                break;

        }
    }

}
