import {
  APP_INITIALIZER,
  ApplicationRef, Compiler,
  Injectable,
  Injector,
  ModuleWithProviders,
  NgModule,
  NgModuleFactoryLoader,
  SkipSelf,
  Optional
} from '@angular/core';
import {CommonModule, Location} from '@angular/common';
import {DummyLocalizeParser, LocalizeParser} from "./localize-router.parser";
import {
  ChildrenOutletContexts,
  Router,
  ROUTER_CONFIGURATION,
  RouteReuseStrategy, RouterModule,
  ROUTES,
  Routes, UrlHandlingStrategy,
  UrlSerializer
} from "@angular/router";
import {LocalizeRouterService} from "./localize-router.service";
import {
  ALWAYS_SET_PREFIX,
  CACHE_MECHANISM,
  CACHE_NAME,
  COOKIE_FORMAT,
  DEFAULT_LANG_FUNCTION,
  INITIAL_NAVIGATION,
  LOCALIZE_ROUTER_FORROOT_GUARD,
  LocalizeRouterConfig,
  LocalizeRouterSettings,
  RAW_ROUTES,
  TRANSLATE_ROUTE,
  USE_CACHED_LANG
} from "./localize-router.config";
import {deepCopy} from "./util";
import {GilsdavReuseStrategy} from "./gilsdav-reuse-strategy";
import {setupRouter} from "./localized-router";
import {TRANSLOCO_SCOPE, TranslocoModule, TranslocoScope} from "@ngneat/transloco";
import {LocalizeRouterPipe} from "./localize-router.pipe";

@Injectable()
export class ParserInitializer {
  parser: LocalizeParser;
  routes: Routes;

  /**
   * CTOR
   */
  constructor(private injector: Injector) {
  }

  appInitializer(): Promise<any> {
    const res = this.parser.load(this.routes);

    return res.then(() => {
      const localize = this.injector.get(LocalizeRouterService);
      const router = this.injector.get(Router);
      const settings = this.injector.get(LocalizeRouterSettings);

      localize.init();

      if (settings.initialNavigation) {
        return new Promise<void>(resolve => {
          // @ts-ignore
          const oldAfterPreactivation = router.hooks.afterPreactivation;
          let firstInit = true;
          // @ts-ignore
          router.hooks.afterPreactivation = () => {
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

  generateInitializer(parser: LocalizeParser, routes: Routes[]): () => Promise<any> {
    this.parser = parser;
    this.routes = routes.reduce((a, b) => a.concat(b));
    return this.appInitializer;
  }
}

export function getAppInitializer(p: ParserInitializer, parser: LocalizeParser, routes: Routes[]): any {
  // DeepCopy needed to prevent RAW_ROUTES mutation
  const routesCopy = deepCopy(routes);
  return p.generateInitializer(parser, routesCopy).bind(p);
}

@NgModule({
  imports: [CommonModule, RouterModule, TranslocoModule],
  declarations: [LocalizeRouterPipe],
  exports: [LocalizeRouterPipe]
})
export class LocalizeRouterModule {
  static forRoot(routes: Routes, config: LocalizeRouterConfig = {}): ModuleWithProviders<LocalizeRouterModule> {
    return {
      ngModule: LocalizeRouterModule,
      providers: [
        {
          provide: Router,
          useFactory: setupRouter,
          deps: [
            ApplicationRef, UrlSerializer, ChildrenOutletContexts, Location, Injector,
            NgModuleFactoryLoader, Compiler, ROUTES, LocalizeParser, ROUTER_CONFIGURATION,
            [UrlHandlingStrategy, new Optional()], [RouteReuseStrategy, new Optional()]
          ]
        },
        {
          provide: LOCALIZE_ROUTER_FORROOT_GUARD,
          useFactory: provideForRootGuard,
          deps: [[LocalizeRouterModule, new Optional(), new SkipSelf()]]
        },
        {provide: TRANSLATE_ROUTE, useValue: config.translateRoute},
        {provide: USE_CACHED_LANG, useValue: config.useCachedLang},
        {provide: ALWAYS_SET_PREFIX, useValue: config.alwaysSetPrefix},
        {provide: CACHE_NAME, useValue: config.cacheName},
        {provide: CACHE_MECHANISM, useValue: config.cacheMechanism},
        {provide: DEFAULT_LANG_FUNCTION, useValue: config.defaultLangFunction},
        {provide: COOKIE_FORMAT, useValue: config.cookieFormat},
        {provide: INITIAL_NAVIGATION, useValue: config.initialNavigation},
        LocalizeRouterSettings,
        config.parser || {provide: LocalizeParser, useClass: DummyLocalizeParser},
        {
          provide: RAW_ROUTES,
          multi: true,
          useValue: routes
        },
        LocalizeRouterService,
        ParserInitializer,
        // { provide: NgModuleFactoryLoader, useClass: LocalizeRouterConfigLoader },
        {
          provide: APP_INITIALIZER,
          multi: true,
          useFactory: getAppInitializer,
          deps: [ParserInitializer, LocalizeParser, RAW_ROUTES]
        },
        {
          provide: RouteReuseStrategy,
          useClass: GilsdavReuseStrategy
        }
      ]
    };
  }

  static forChild(routes: Routes): ModuleWithProviders<LocalizeRouterModule> {
    return {
      ngModule: LocalizeRouterModule,
      providers: [
        {
          provide: RAW_ROUTES,
          multi: true,
          useValue: routes
        }
      ]
    };
  }
}

export function provideForRootGuard(localizeRouterModule: LocalizeRouterModule): string {
  if (localizeRouterModule) {
    throw new Error(
      `LocalizeRouterModule.forRoot() called twice. Lazy loaded modules should use LocalizeRouterModule.forChild() instead.`);
  }
  return 'guarded';
}
