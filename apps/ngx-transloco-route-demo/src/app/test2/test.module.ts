import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoModule } from '@jsverse/trransloco';
import { BobComponent } from './bob/bob.component';
import { TestRoutingModule } from './test.routing.module';
import { Test2Component } from './test2/test2.component';

@NgModule({
  declarations: [BobComponent, Test2Component],
  imports: [CommonModule, TestRoutingModule, TranslocoModule],
})
export class TestModule {}
