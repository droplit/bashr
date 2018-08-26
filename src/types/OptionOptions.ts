// import { CommandInput, CommandOutput } from './index';

export interface OptionOptions {
    alias?: string | string[];
    validator?: (value: any) => boolean;
    // onSpecified? (name: string, value: any, input: CommandInput, output: CommandOutput, next: () => void): void;
    // onUnspecified? (name: string, input: CommandInput, output: CommandOutput, next: () => void): void;
}