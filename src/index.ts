import { getArgumentValidator } from './utils';
import { Command } from 'commander';
import { execSync } from 'child_process';

import { version } from '../package.json';
import { DEFAULT_DATABASE, NODE_SERVICES, DOCXN_PATH } from './constants';

const program = new Command();

program.name('mycli').description('Customizable CLI using plugins').version(version);

program
    .command('tservice')
    .description('Starts Node services and handles haproxy fallback to devCloud services on process exit')
    .argument('<SERVICE_NAME>', 'Node service name to start', getArgumentValidator(Object.keys(NODE_SERVICES)))
    .option('-db, --database <DATABASE>', 'Database name to pass as env to node service', DEFAULT_DATABASE)
    .option(
        '-l, --logs-home <LOGS_PATH>',
        'LOGS_HOME env to pass at node service, fallbacks to $HOME/tracxn/logs/<SERVICE_NAME>/.',
    )
    .option(
        '-p, --port <PORT>',
        'Port number to pass as env to node service, fallbacks to default port based on service.',
    )
    .action((serviceName: keyof typeof NODE_SERVICES, options: { database: string }) => {
        console.log({ serviceName, options });
        const { PORT, path } = NODE_SERVICES[serviceName];
        const { database } = options;
        let serviceStopped = false;
        // Cleanup
        ['SIGINT', 'exit', 'SIGQUIT', 'SIGTERM'].forEach(signal => {
            process.on(signal, () => {
                console.log(`\nmycli: Received exit signal(${signal}), so stopping ${serviceName} service.\n`);
                console.log(`mycli: Running \`docxn ${serviceName} stop\` to point haproxy to devCloud service.\n`);
                if (!serviceStopped) {
                    // docxn <service> stop
                    execSync(`python3 ${DOCXN_PATH} ${serviceName} stop`, {
                        encoding: 'utf8',
                        stdio: [0, 1, 2],
                    });
                }
                serviceStopped = true;
                console.log(`mycli: Done.\n`);
            });
        });

        console.log(
            `mycli: Running \`docxn ${serviceName} start\` to point haproxy to local ${serviceName} service.\n`,
        );

        // docxn <service> start;
        execSync(`python3 ${DOCXN_PATH} ${serviceName} start`, {
            encoding: 'utf8',
            stdio: [0, 1, 2],
        });

        console.log(`\nmycli: haproxy is now pointed to local ${serviceName} service.\n`);

        console.log(`\nmycli: Starting ${serviceName} service in local with logs.\n`);

        // docxn <service> start
        execSync(
            `cd ${path} && LOGS_HOME=$HOME/tracxn/logs/${serviceName}/ DATABASE=${
                database || 'tracxndev'
            } PORT=${PORT} yarn dev`,
            {
                encoding: 'utf8',
                stdio: [0, 1, 2],
            },
        );
    });

program.parse();
