import 'mocha';
import { expect } from 'chai';
import * as bashr from '../';

describe('Help', function () {
    it('Info description', done => {
        const cli = new bashr.CLI('myCLI');
        const route = cli.route('myRoute');
        const handler: bashr.CommandHandler = (input, output) => {
            // console.log(route.name, route.params, route.options, route.info);
            // console.log(route.commands);
            expect(route.commands.find((command)=> command.name == 'hello').info.description).to.equal('Hello World');
            done();
        };
        const command = route.command('hello', () => {
            // console.log('world')
        });
        command.info = { description: 'Hello World' };
        route.command('help', handler);
        cli.run(['', '', 'myRoute', 'help']);
    });
});