import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { SharedDirectivesModule } from 'src/app/directives/shared-directives.module';
import { BrowserModule } from '@angular/platform-browser';

import { LazyLoadImageModule } from 'ng-lazyload-image';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    SharedDirectivesModule,
    FormsModule, 
    ReactiveFormsModule,
    LazyLoadImageModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
