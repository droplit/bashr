import { ParameterOptions, OptionOptions, CommandHandler, CommandInput, CommandOutput } from './types';

interface RouteInfo {
    path: string;
    pathTokens: string[];
    route?: Route;
    lazyLoader?: LazyLoader;
}

interface LazyLoader { (): Route; }

export class Route<TContext = any> {

    private routes: RouteInfo[] = [];

    private params: {[name: string]: ParameterOptions} = {};
    private options: {[name: string]: OptionOptions} = {};

    constructor() {
    }

    public param(name: string, options: ParameterOptions) {
        this.params[name] = options;
    }

    public option(name: string, options: OptionOptions) {
        this.options[name] = options;
    }

    public use(...handler: CommandHandler<TContext>[]): Route {
        return this;
    }

    public command(path: string, ...handler: CommandHandler<TContext>[]): this {
        return this;
    }

    public route(path: string, route?: Route): any {
        route = route || new Route();
        this.routes.push({
            path,
            pathTokens: Route.tokenizeRoutePath(path),
            route
        });
        return route;
    }

    public lazyRoute(path: string, loader: (() => Route)): Promise<Route>;
    public lazyRoute(path: string, requirePath: string): Promise<Route>;
    public lazyRoute(path: string, loaderOrPath: (() => Route) | string): any {
        return new Promise((resolve, reject) => {
            let loader: LazyLoader | undefined;
            if (typeof(loaderOrPath) === 'function') {
                loader = () => {
                    const route = loaderOrPath();
                    resolve(route);
                    return route;
                };
            } else if (typeof(loaderOrPath) === 'string') {
                loader = () => {
                    const route = require(loaderOrPath);
                    resolve(route);
                    return route;
                };
            } else {
                reject(new Error('Must specify a loader function or a path string'));
            }
            this.routes.push({
                path,
                pathTokens: Route.tokenizeRoutePath(path),
                lazyLoader: loader
            });
        });
    }

    private static tokenizeRoutePath(path: string): string[] {
        return path.split(' ');
    }

    private static testPath(inputArgs: string[], routeTokens: string): boolean {

        return true;
    }
}