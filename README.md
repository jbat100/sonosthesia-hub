# Sonosthesia-Hub

Part of the [Sonosthesia](http://www.sonosthesia.com/home) project.

## Project Overview

The Hub is the central building block in Sonosthesia. It allows all the other software components to talk to each other. 


It implements networking, messaging, mapping and processing functionality as Typescript modules running on [Node](https://nodejs.org/en/). This can be used independently or with a web-based UI based on [Angular](https://angular.io/), using [Electron](https://electron.atom.io/) to fuse the node and chromium runtimes. Client components can connect to the hub using websockets or raw tcp, exchanging JSON messages. Other connection options may be added later as the need arises.