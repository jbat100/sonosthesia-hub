/**
 * Created by jonathan on 05/02/2017.
 */

export enum HubMessageType {
    Component,
    Action,
    Control,
    Create,
    Destroy
}

const HubMessageContentClasses = new Map<HubMessageType, string>();

HubMessageContentClasses[HubMessageType.Component] = 'a';
HubMessageContentClasses[HubMessageType.Control] = 'b';

const has = HubMessageContentClasses.has(HubMessageType.Component);

const result = HubMessageContentClasses[HubMessageType.Component];

console.log('end');