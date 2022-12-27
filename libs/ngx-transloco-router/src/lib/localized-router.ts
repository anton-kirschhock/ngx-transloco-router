﻿import { Router, LoadChildren, ROUTES } from '@angular/router';
import {
  Injector,
  Compiler,
  NgModuleFactory,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { Location, isPlatformBrowser } from '@angular/common';
import { from, of, isObservable, Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { flatten, isPromise } from './util';
import { LocalizeParser } from './localize-router.parser';

export class LocalizedRouter extends Router {
  private platformId = inject(PLATFORM_ID);
  private compiler = inject(Compiler);
  private localize = inject(LocalizeParser);

  constructor() {
    super();
    // Custom configuration
    const isBrowser = isPlatformBrowser(this.platformId);
    // __proto__ is needed for preloaded modules be doesn't work with SSR
    const configLoader = isBrowser
      ? // @ts-ignore
        (this as any).navigationTransitions.configLoader.__proto__
      : // @ts-ignore
        (this as any).navigationTransitions.configLoader;

    configLoader.loadModuleFactoryOrRoutes = (loadChildren: LoadChildren) => {
      return wrapIntoObservable(loadChildren()).pipe(
        mergeMap((t: any) => {
          let compiled: Observable<NgModuleFactory<any> | Array<any>>;
          if (t instanceof NgModuleFactory || Array.isArray(t)) {
            compiled = of(t);
          } else {
            compiled = from(this.compiler.compileModuleAsync(t)) as Observable<
              NgModuleFactory<any>
            >;
          }
          return compiled.pipe(
            map((factory) => {
              if (Array.isArray(factory)) {
                return factory;
              }
              return {
                moduleType: factory.moduleType,
                create: (parentInjector: Injector) => {
                  const module = factory.create(parentInjector);
                  const getMethod = module.injector.get.bind(module.injector);

                  module.injector['get'] = (
                    token: any,
                    notFoundValue: any,
                    flags?: any
                  ) => {
                    const getResult = getMethod(token, notFoundValue, flags);

                    if (token === ROUTES) {
                      // translate lazy routes
                      return this.localize.initChildRoutes(
                        [].concat(...getResult)
                      );
                    } else {
                      return getResult;
                    }
                  };
                  return module;
                },
              };
            })
          );
        })
      );
    };
    // (this as any).navigations = (this as any).setupNavigations((this as any).transitions);
  }
}

export function wrapIntoObservable<T>(
  value: T | NgModuleFactory<T> | Promise<T> | Observable<T>
) {
  if (isObservable(value)) {
    return value;
  }

  if (isPromise(value)) {
    // Use `Promise.resolve()` to wrap promise-like instances.
    // Required ie when a Resolver returns a AngularJS `$q` promise to correctly trigger the
    // change detection.
    return from(Promise.resolve(value));
  }

  return of(value);
}
