import { Command, InvalidArgumentError } from 'commander';

import { version } from '../package.json';
import { DEFAULT_DATABASE, NODE_SERVICES } from './constants';

const program = new Command();

program.name('mycli').description('Customizable CLI using plugins').version(version);

program
    .command('tservice')
    .description('Starts Node services and handles haproxy fallback to devCloud services on process exit')
    .argument('<SERVICE_NAME>', 'Node service name to start', serviceName => {
        const nodeServiceNames = Object.keys(NODE_SERVICES);
        if (!nodeServiceNames.includes(serviceName)) {
            throw new InvalidArgumentError(`Possible values - ${nodeServiceNames.join(', ')}.`);
        }
        return serviceName;
    })
    .option('-db, --database <DATABASE>', 'Database name to pass as env to node service', DEFAULT_DATABASE)
    .option(
        '-l, --logs-home <LOGS_PATH>',
        'LOGS_HOME env to pass at node service, fallbacks to $HOME/tracxn/logs/<SERVICE_NAME>/.',
    )
    .option(
        '-p, --port <PORT>',
        'Port number to pass as env to node service, fallbacks to default port based on service.',
    )
    .action((str, options) => {
        console.log({ str, options });
    });

program.parse();
