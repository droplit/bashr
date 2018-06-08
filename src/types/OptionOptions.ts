import { CommandInput, CommandOutput } from './index';

export interface OptionOptions {
    name?: string;
    shorthand?: string;
    onSpecified? (name: string, value: any, input: CommandInput, output: CommandOutput, next: () => void): void;
    onUnspecifed? (name: string, input: CommandInput, output: CommandOutput, next: () => void): void;
}