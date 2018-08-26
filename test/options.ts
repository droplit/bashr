import 'mocha';
import { expect } from 'chai';
import * as bashr from '../';

describe('Options', function () {
    it('Run CLI command', function (done) {
        const handler: bashr.CommandHandler = (input, output) => {
            console.log(input)
            expect(input.options['test']).to.exist;
            done();
        };
        const cli = new bashr.CLI('myCLI');
        cli.command('test --test', handler)
        cli.option('test', { name: 'test', shorthand: 't' });
        cli.run(['', '', 'test', '--test']);
    });
});