
// https://journal.artfuldev.com/write-tests-for-typescript-projects-with-mocha-and-chai-in-typescript-86e053bdb2b6#.ddi6y2q2a

import 'jasmine';
import * as Rx from 'rxjs/Rx';
import { expect } from 'chai';

import {FileUtils} from '../lib/core'
import {ComponentInfo, ChannelInfo} from '../lib/component';

describe('Component tests', () => {

    describe('Info parsing', () => {

        const validParameterInfo = {
            identifier: "valid-parameter",
            defaultValue: 0.0,
            range: {min:0.0, max:1.0}
        };

        const invalidParameterInfo = {
            identifier: "valid-parameter"
        };

        const emptyChannelInfo = {
            identifier: "empty-channel",
            flow: 'Emitter',
            type: 'Control',
            parameters: []
        };

        const validChannelInfo = {
            identifier: "valid-channel",
            flow: 'Emitter',
            type: 'Control',
            parameters: [validParameterInfo]
        };

        const invalidChannelInfo = {
            identifier: "valid-channel",
            flow: 'Unrecognized',
            type: 'Control',
            parameters: [validParameterInfo]
        };

        it('should initialise empty component', () => {
            const info = <ComponentInfo> ComponentInfo.newFromJSON(
                {
                    identifier: "boo",
                    channels: []
                }
            );
            expect(info.identifier).to.equal('boo');
            expect(info.channels).to.be.empty;
        });

        it('should initialise component with valid channel', () => {
            const info = <ComponentInfo> ComponentInfo.newFromJSON(
                {
                    identifier: "boo",
                    channels: [validChannelInfo]
                }
            );
            expect(info.identifier).to.equal('boo');
            expect(info.channels).to.have.length(1);
        });

        it('should not initialise component with invalid channel', () => {
            expect(() => {
                ComponentInfo.newFromJSON({
                    identifier: "boo",
                    channels: [invalidChannelInfo]
                })
            }).to.throw;
        });

        it('should not initialise channel with invalid parameter info', () => {
            expect(() => {
                ChannelInfo.newFromJSON({
                    identifier: "boo",
                    parameter: [invalidParameterInfo]
                })
            }).to.throw;
        });

        it('should parse local component configuration file correctly', () => {
            return FileUtils.readJSONFile('../../../config/local.component.json', {}).then((obj : any) => {
                const component : ComponentInfo = ComponentInfo.newFromJSON(obj.components[0]) as ComponentInfo;
                const channels = component.channels;
                expect(channels).to.have.length(2);
                expect(channels[0].identifier).to.equal('channel1');
                expect(channels[1].identifier).to.equal('channel2');
                const parameters = channels[0].parameters;
                expect(parameters[0].identifier).to.equal('parameter1a');
                expect(parameters[1].identifier).to.equal('parameter1b');
            });
        });

    });

});