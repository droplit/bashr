import * as bashr from '../library';

const route = new bashr.Route();

route.param('ecosystemId', {friendlyName: 'id', validationRegex: /\w{2,3}/});

const commands = route.route(':ecosystemId');

commands.command('info', infoCommand);

function infoCommand(input: bashr.CommandInput, output: bashr.CommandOutput) {

}

exports = route;