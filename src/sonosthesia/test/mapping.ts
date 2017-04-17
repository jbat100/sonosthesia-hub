
// https://journal.artfuldev.com/write-tests-for-typescript-projects-with-mocha-and-chai-in-typescript-86e053bdb2b6#.ddi6y2q2a

import 'mocha';
import * as Q from 'q';
import { expect } from 'chai';

import {FileUtils} from '../lib/core'
import {ComponentInfo, ChannelInfo} from '../lib/component';

import {HubManager} from "../lib/hub";
import {HubConfiguration, ConnectorType} from "../lib/configuration";
import {TCPClient} from "../lib/client";

// note that UNIX which is where under windows
// https://www.npmjs.com/package/ts-node
// cd test
// mocha --compilers ts:ts-node/register,tsx:ts-node/register mapping.ts

const hubPort = 3333;
const localAddress = 'localhost';

describe('Mapping tests', () => {

    // setup a hub manager and two clients

    let hubManager : HubManager;
    let client1 : TCPClient;
    let client2 : TCPClient;

    function setupHubManager() : Q.Promise<void> {
        return Q().then(() => {
            const hubConfig = new HubConfiguration();
            hubConfig.connectorType = ConnectorType.TCP;
            hubConfig.port = hubPort;
            return hubConfig;
        }).then((hubConfig : HubConfiguration) => {
            hubManager = new HubManager(hubConfig);
            return hubManager.setup();
        });
    }

    // before tests, setup the hub manager (which runs the tcp server) and create the tcp clients
    before(() => {
        return setupHubManager().then(() => {
            return TCPClient.newTCPClient(localAddress, hubPort);
        }).then((client : TCPClient) => {
            client1 = client;
            return TCPClient.newTCPClient(localAddress, hubPort);
        }).then((client : TCPClient) => {
            client2 = client;
        })
    });

    afterEach(() => {
        hubManager.reset();
    });

    describe('Loopback', () => {

        // mapping from one component channel back to the same component channel

        it('should', () => {
            //
        });

    });

    describe('Multi channel', () => {

        it('should', () => {
            //
        });

    });

    describe('Multi component', () => {

        it('should', () => {
            //
        });

    });

    describe('Multi client', () => {

        it('should', () => {
            //
        });

    });

});