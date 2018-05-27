export interface CommandInput<TContext = any> {
    path: string;
    params: {[name: string]: any};
    options: {[name: string]: any};
    context: TContext;
}

export interface CommandOutput {
    log: any;
}

export interface CommandHandler<TContext = any> { (input: CommandInput<TContext>, output?: any, next?: () => void): void; }