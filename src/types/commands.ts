export interface CommandInput<TContext = any> {
    path: string;
    params: {[name: string]: any};
    options?: {[name: string]: any};
    context?: TContext;
}

export interface CommandOutput {
    log: (message?: any, ...optionalParams: any[]) => void;
    done: (error?: Error) => any;
}

export interface CommandHandler<TContext = any> { (input: CommandInput<TContext>, output: CommandOutput, next?: () => void): void; }