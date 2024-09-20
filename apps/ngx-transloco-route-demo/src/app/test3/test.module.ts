import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { BobComponent } from './bob/bob.component';
import { TestRoutingModule } from './test.routing.module';
import { Test3Component } from './test3/test3.component';

@NgModule({
  declarations: [BobComponent, Test3Component],
  imports: [CommonModule, TestRoutingModule, TranslocoModule],
})
export class TestModule {}
