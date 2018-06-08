import * as bashr from '../library';

const droplit = new bashr.CLI('droplit');

// const ecosystem = droplit.route('ecosystem :ecosystemId');
// droplit.lazyRoute('ecosystem', () => require('ecosystemRoute'));

// droplit.route('ecosystem').param('ecosystemId', {friendlyName: 'id', validationRegex: /\w{2,3}/});

// droplit.lazyRoute('ecosystem :ecosystemId', './ecosystemRoute');

droplit.lazyRoute('ecosystem', './ecosystemRoute');

droplit.lazyRoute('environment', './environmentRoute');
droplit.lazyRoute('device', './deviceRoute');

droplit.run(process.argv);

console.log('done');