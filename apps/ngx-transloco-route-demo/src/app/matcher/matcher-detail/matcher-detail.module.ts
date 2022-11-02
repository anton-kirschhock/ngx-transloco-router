import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatcherDetailComponent } from './matcher-detail.component';
import {
  RouterModule,
  Routes,
  UrlMatchResult,
  UrlSegment,
} from '@angular/router';
import {
  LocalizedMatcherUrlSegment,
  LocalizeRouterModule,
} from '@penleychan/ngx-transloco-router';
import { TranslocoModule } from '@ngneat/transloco';

export function detailMatcher(baseSegments: UrlSegment[]): UrlMatchResult {
  const segments = [...baseSegments];
  // /:id
  // /:a/:id
  // /:a/:b/:id
  // /:a/:b/:c/:id

  if (!segments.length || !isId(segments[segments.length - 1])) {
    return null;
  }

  const result: UrlMatchResult = {
    consumed: [],
    posParams: {},
  };

  for (const segment of 'abc'.substr(0, segments.length - 1)) {
    takeSegment(segment);
  }
  takeSegment('id');

  return result;

  function takeSegment(name: string): void {
    const segment = segments.shift();
    (segment as LocalizedMatcherUrlSegment).localizedParamName = name;
    result.consumed.push(segment);
    result.posParams[name] = segment;
  }
  function isId(url: UrlSegment): boolean {
    return (
      (url.path.startsWith('ROUTES.') ? url.path.substring(7) : url.path).match(
        /^[a-f\d]{8}$/i
      ) !== null
    );
  }
}

const routes: Routes = [
  {
    path: '',
    component: MatcherDetailComponent,
    data: { discriminantPathKey: 'DETAIL' },
  },
];

@NgModule({
  declarations: [MatcherDetailComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    LocalizeRouterModule.forChild(routes),
    TranslocoModule,
  ],
  exports: [RouterModule, LocalizeRouterModule],
})
export class MatcherDetailModule {}
