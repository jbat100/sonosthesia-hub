
// https://journal.artfuldev.com/write-tests-for-typescript-projects-with-mocha-and-chai-in-typescript-86e053bdb2b6#.ddi6y2q2a

import 'jasmine';

import * as path from 'path';

import * as Chance from 'chance';
import * as Q from 'q';
import { expect } from 'chai';

import {FileUtils} from '../lib/core'
import {ComponentInfo, ChannelInfo, ChannelSelection, ParameterInfo} from '../lib/component';

import {HubManager} from "../lib/hub";
import {HubConfiguration, ConnectorType} from "../lib/configuration";
import {TCPClient} from "../lib/client";
import {ChannelMapping} from "../lib/mapping";
import {HubMessage, ControlMessageContent, HubMessageType, Parameters} from "../lib/messaging";

// note that UNIX which is where under windows
// https://www.npmjs.com/package/ts-node
// cd test
// mocha --compilers ts:ts-node/register,tsx:ts-node/register mapping.ts

const chance = new Chance();

const hubPort = 3333;
const localAddress = 'localhost';
const testFileDirectory = path.join(process.cwd(), 'json');
const testFileNames = [ 'test1.component.json', 'test2.component.json' ];

describe('Mapping tests', () => {

    // setup a hub manager and two clients

    let hubManager : HubManager;
    let client1 : TCPClient;
    let client2 : TCPClient;
    let componentInfoList : ComponentInfo[] = [];
    let testFilePaths = testFileNames.map(name => { return path.join(testFileDirectory, name); });

    function wait(delay = 100) {
        if (!delay) delay = 100;
        return Q.delay(delay);
    }

    function setupHubManager() : Q.Promise<void> {
        return Q().then(() => {
            const hubConfig = new HubConfiguration();
            hubConfig.connectorConfigurations.push({
                connectorType:ConnectorType.TCP,
                enabled:true,
                port:hubPort
            });
            return hubConfig;
        }).then((hubConfig : HubConfiguration) => {
            hubManager = new HubManager(hubConfig);
            return hubManager.setup();
        });
    }

    function getComponentInfo(identifier : string) {
        return componentInfoList.find((info) => { return info.identifier === identifier; });
    }

    // creates test control message with parameter values described
    function createTestControlMessage(selection : ChannelSelection, instance : string) : HubMessage {
        const componentInfo : ComponentInfo = getComponentInfo(selection.componentSelection.identifier);
        const channelInfo : ChannelInfo = componentInfo.getChannelInfo(selection.identifier);
        const parameters = new Parameters();
        channelInfo.parameters.forEach((parameterInfo : ParameterInfo) => {
            const val : number = chance.floating({min:parameterInfo.range.min, max:parameterInfo.range.max});
            parameters.setParameter(parameterInfo.identifier, [val]);
        });
        const content = new ControlMessageContent(
            selection.componentSelection.identifier,
            selection.identifier,
            instance,
            null,
            parameters);
        return new HubMessage(HubMessageType.Control, null, content);
    }

    // before tests, setup the hub manager (which runs the tcp server) and create the tcp clients
    beforeAll(() => {
        return setupHubManager().then(() => {
            return TCPClient.newTCPClient(localAddress, hubPort);
        }).then((client : TCPClient) => {
            client1 = client;
            return TCPClient.newTCPClient(localAddress, hubPort);
        }).then((client : TCPClient) => {
            client2 = client;
            return Q.all(testFilePaths.map(filePath => { return ComponentInfo.importFromFile(filePath); }));
        }).then((results) => {
            results.forEach((result) => { componentInfoList = componentInfoList.concat(result) })
        });
    });

    afterEach(() => {
        return Q().then(() => {
            client1.clearComponents();
            client2.clearComponents();
            hubManager.reset();
            return wait();
        })

    });

    describe('Loopback', () => {

        // mapping from one component channel back to the same component channel

        const componentInfo = componentInfoList[0];
        const channelInfo = componentInfo.channels[0];

        beforeAll(() => {
            return Q().then(() => {
                client1.registerComponent(componentInfo);
                return wait();
            });

        });

        it('should register mapping', () => {
            const mapping = new ChannelMapping(hubManager.mappingManager, hubManager.componentManager);
            mapping.output.componentSelection.identifier = componentInfo.identifier;
            mapping.output.identifier = channelInfo.identifier;
            mapping.input.componentSelection.identifier = componentInfo.identifier;
            mapping.input.identifier = channelInfo.identifier;
            expect(mapping.output.valid).to.be.true;
            expect(mapping.input.valid).to.be.true;
        });

        it('should loopback', () => {

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