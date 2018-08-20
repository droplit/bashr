import * as bashr from '../../';
export const route = new bashr.Route('foo');
route.command('bar', (input, output, next) => {
    output.log('baz');
    output.done();
});