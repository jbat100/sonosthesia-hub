/**
 * Created by jonathan on 07/02/2017.
 */

import sonosthesia from './sonosthesia';

export class Test {


    constructor(private _boo : string) {

    }

    baa() : number {
        return 2;
    }

}

// how do we get type information here?
const message = new sonosthesia.messaging.MessageContent();