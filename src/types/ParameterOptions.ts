import { CommandInput, CommandOutput } from './index';

export interface ParameterOptions {
    friendlyName?: string;
    validationRegex?: RegExp;
    validator?: (value: any) => boolean;
    onSpecified? (name: string, value: any, input: CommandInput, output: CommandOutput, next: () => void): void;
    onUnspecifed? (name: string, input: CommandInput, output: CommandOutput, next: () => void): void;
}