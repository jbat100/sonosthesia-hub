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

class A {
    static Bla = 'bli';
}

class B extends A {
    static Bla = 'blu';
}

const a : A = new A();
console.log((a.constructor as any).Bla);

const b : B = new B();
console.log((b.constructor as any).Bla);