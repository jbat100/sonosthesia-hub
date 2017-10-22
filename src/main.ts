
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from 'environments';

import * as sonosthesia  from './sonosthesia';

import 'bootstrap/dist/css/bootstrap.css';
import 'nouislider/distribute/nouislider.min.css';
import './styles.scss';

if (environment.production) {
  enableProdMode();
}

console.log("Sonosthesia test: " + sonosthesia.Message);


platformBrowserDynamic().bootstrapModule(AppModule);
