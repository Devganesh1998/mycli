import { Command } from 'commander';
import { execSync } from 'child_process';
import { NODE_SERVICES, DEFAULT_DATABASE, T_NODE_SERVICE_STATUS } from './../constants';
import { getArgumentValidator, updateThaproxyNodeServiceRoute } from './../utils';

const registerCommands = (program: Command) => {
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
            '-pa, --path <SERVICE_PATH>',
            'If need to run service from custom path, can use this option. Accepts absolute path only.',
        )
        .option(
            '-p, --port <PORT>',
            'Port number to pass as env to node service, fallbacks to default port based on service.',
        )
        .action(
            (
                serviceName: keyof typeof NODE_SERVICES,
                options: { database: string; logsHome: string; port: string; path: string },
            ) => {
                const { PORT, path } = NODE_SERVICES[serviceName];
                const { database, logsHome, port, path: pathFromArg } = options;
                const serviceLogsHome = logsHome ? logsHome : `$HOME/tracxn/logs/${serviceName}/`;
                const servicePort = Number.isNaN(parseInt(port)) ? PORT : parseInt(port);
                const servicePath = pathFromArg || path;
                let serviceStopped = false;
                // Cleanup
                ['SIGINT', 'exit', 'SIGQUIT', 'SIGTERM'].forEach(signal => {
                    process.on(signal, () => {
                        console.log(`\nmycli: Received exit signal(${signal}), so stopping ${serviceName} service.\n`);
                        if (!serviceStopped) {
                            // docxn <service> stop
                            updateThaproxyNodeServiceRoute({ service: serviceName, status: T_NODE_SERVICE_STATUS.AWS });
                            serviceStopped = true;
                        }
                        console.log(
                            `mycli: Tracxn's Haproxy will now point to devCloud's \`${serviceName}\` service.\n`,
                        );
                        console.log(`mycli: Done.\n`);
                        process.exit(0);
                    });
                });

                // docxn <service> start;
                updateThaproxyNodeServiceRoute({ service: serviceName, status: T_NODE_SERVICE_STATUS.LOCAL });

                console.log(`mycli: Tracxn's Haproxy is now pointing to local ${serviceName} service.\n`);

                console.log(
                    `\nmycli: Starting ${serviceName} service in local with DATABASE: ${
                        database || 'tracxndev'
                    }, LOGS_HOME: ${serviceLogsHome}, PORT: ${servicePort} envs at Path - ${servicePath}.\n`,
                );

                // docxn <service> start
                execSync(
                    `cd ${servicePath} && LOGS_HOME=${serviceLogsHome} DATABASE=${
                        database || 'tracxndev'
                    } PORT=${servicePort} yarn dev`,
                    {
                        encoding: 'utf8',
                        stdio: [0, 1, 2],
                    },
                );
            },
        );
};

export default registerCommands;
