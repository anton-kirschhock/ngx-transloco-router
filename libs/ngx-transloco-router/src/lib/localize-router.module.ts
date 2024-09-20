import { CommonModule, Location } from '@angular/common';
import {
  APP_INITIALIZER,
  Injectable,
  Injector,
  ModuleWithProviders,
  NgModule,
  Optional,
  Provider,
  SkipSelf
} from '@angular/core';
import {
  Router,
  RouteReuseStrategy,
  RouterModule,
  Routes,
} from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { GilsdavReuseStrategy } from './gilsdav-reuse-strategy';
import {
  LOCALIZE_ROUTER_CONFIG,
  LOCALIZE_ROUTER_FORROOT_GUARD,
  LocalizeRouterConfig,
  RAW_ROUTES,
} from './localize-router.config';
import {
  DefaultLocalizeParser,
  LocalizeParser,
} from './localize-router.parser';
import { LocalizeRouterPipe } from './localize-router.pipe';
import { LocalizeRouterService } from './localize-router.service';
import { LocalizedRouter } from './localized-router';
import { deepCopy } from './util';

@Injectable()
export class ParserInitializer {
  parser: LocalizeParser;
  routes: Routes;

  constructor(private injector: Injector) {}

  appInitializer(): Promise<any> {
    const res = this.parser.load(this.routes);

    return res.then(() => {
      const localize = this.injector.get(LocalizeRouterService);
      const router = this.injector.get(Router);
      const settings: LocalizeRouterConfig = this.injector.get(
        LOCALIZE_ROUTER_CONFIG
      );
      localize.init();

      if (settings.initialNavigation) {
        return new Promise<void>((resolve) => {
          const oldAfterPreactivation =
            // @ts-ignore
            router.navigationTransitions.afterPreactivation;
          let firstInit = true;
          // @ts-ignore
          router.navigationTransitions.afterPreactivation = () => {
            if (firstInit) {
              resolve();
              firstInit = false;
              localize.hooks._initializedSubject.next(true);
              localize.hooks._initializedSubject.complete();
            }
            return oldAfterPreactivation();
          };
        });
      } else {
        localize.hooks._initializedSubject.next(true);
        localize.hooks._initializedSubject.complete();
      }
    });
  }

  generateInitializer(
    parser: LocalizeParser,
    routes: Routes[]
  ): () => Promise<any> {
    this.parser = parser;
    this.routes = routes.reduce((a, b) => a.concat(b));
    return this.appInitializer;
  }
}

export function getAppInitializer(
  p: ParserInitializer,
  parser: LocalizeParser,
  routes: Routes[]
): any {
  // DeepCopy needed to prevent RAW_ROUTES mutation
  const routesCopy = deepCopy(routes);
  return p.generateInitializer(parser, routesCopy).bind(p);
}

@NgModule({
  imports: [CommonModule, RouterModule, TranslocoModule],
  declarations: [LocalizeRouterPipe],
  exports: [LocalizeRouterPipe],
})
export class LocalizeRouterModule {
  static forRoot(
    routes: Routes,
    config: { parser?: Provider } = {}
  ): ModuleWithProviders<LocalizeRouterModule> {
    return {
      ngModule: LocalizeRouterModule,
      providers: [
        {
          provide: Router,
          useClass: LocalizedRouter,
        },
        {
          provide: LOCALIZE_ROUTER_FORROOT_GUARD,
          useFactory: provideForRootGuard,
          deps: [[LocalizeRouterModule, new Optional(), new SkipSelf()]],
        },
        {
          provide: RAW_ROUTES,
          multi: true,
          useValue: routes,
        },
        config.parser || {
          provide: LocalizeParser,
          useClass: DefaultLocalizeParser,
          deps: [TranslocoService, Location, LOCALIZE_ROUTER_CONFIG],
        },
        LocalizeRouterService,
        ParserInitializer,
        {
          provide: APP_INITIALIZER,
          multi: true,
          useFactory: getAppInitializer,
          deps: [ParserInitializer, LocalizeParser, RAW_ROUTES],
        },
        {
          provide: RouteReuseStrategy,
          useClass: GilsdavReuseStrategy,
        },
      ],
    };
  }

  static forChild(routes: Routes): ModuleWithProviders<LocalizeRouterModule> {
    return {
      ngModule: LocalizeRouterModule,
      providers: [
        {
          provide: RAW_ROUTES,
          multi: true,
          useValue: routes,
        },
      ],
    };
  }
}

export function provideForRootGuard(
  localizeRouterModule: LocalizeRouterModule
): string {
  if (localizeRouterModule) {
    throw new Error(
      `LocalizeRouterModule.forRoot() called twice. Lazy loaded modules should use LocalizeRouterModule.forChild() instead.`
    );
  }
  return 'guarded';
}
