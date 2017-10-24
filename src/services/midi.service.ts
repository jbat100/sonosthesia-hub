
import { Injectable } from '@angular/core';

import * as q from 'q';

// midi is defined in webpack externals
//let midi = require('midi');

let os = require('os');
let midi = require('midi');

@Injectable()
export class MidiService {

    readonly tag = 'MidiService';

    midiInput : any;
    midiOutput : any;

    testMidi()  {

        try {

            console.log(this.tag + " testMidi 1");

            // Set up a new input.
            this.midiInput = new midi.input();

            // Count the available input ports.
            const icount = this.midiInput.getPortCount();

            console.log(this.tag + " process midi input count : " + icount);

            this.midiOutput = new midi.output();

            // Count the available output ports.
            const ocount = this.midiOutput.getPortCount();

            console.log(this.tag + " process midi output count : " + ocount);

            this.playNoteOnPort(3);
        } catch (err) {

            console.error(err.message);

        }


    }

    playNoteOnPort(i : number) {

        const name = this.midiOutput.getPortName(i);

        console.log(this.tag + " opening output port " + name);
        // Open the first available output port.
        this.midiOutput.openPort(i);

        q().then(() => {
            // Send a MIDI note on message. https://www.music.mcgill.ca/~gary/rtmidi/
            console.log(this.tag + " sending note on to output port " + name);
            this.midiOutput.sendMessage([144, 64, 90]);
        }).delay(1000).then(() => {
            console.log(this.tag + " sending note off to output port " + name);
            this.midiOutput.sendMessage([128, 64, 40]);
        }).delay(1000).then(() => {
            console.log(this.tag + " closing output port " + name);
            // Close the port when done.
            this.midiOutput.closePort();
        });

    }

}
