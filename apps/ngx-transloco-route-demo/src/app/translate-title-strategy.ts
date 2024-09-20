import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslocoService } from '@jsverse/transloco';

@Injectable()
export class TranslateTitleStrategy extends TitleStrategy {
  constructor(
    private translocoService: TranslocoService,
    private readonly title: Title
  ) {
    super();
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    let title = this.buildTitle(snapshot);
    if (!title) {
      title = 'DEFAULT_TITLE';
    }
    this.title.setTitle(this.translocoService.translate(title));
  }
}
