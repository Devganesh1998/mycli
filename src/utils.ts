import { platform } from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { InvalidArgumentError } from 'commander';
import fs from 'fs';
import { DOCXN_SERVICE_ROUTE_CONFIG_FILE, T_NODE_SERVICE_STATUS, NODE_SERVICES } from './constants';

export const getArgumentValidator = (possibleValues: string[]) => (value: string) => {
    if (!possibleValues.includes(value)) {
        throw new InvalidArgumentError(`Possible values - ${possibleValues.join(', ')}.`);
    }
    return value;
};

export const logToConsole = (message: string, status: 'INFO' | 'ERROR' | 'SUCCESS' = 'INFO') => {
    let updatedMessage = `\nmycli: ${message}.`;
    switch (status) {
        case 'INFO': {
            updatedMessage = chalk.blue(updatedMessage);
            break;
        }
        case 'SUCCESS': {
            updatedMessage = chalk.green(updatedMessage);
            break;
        }
        case 'ERROR': {
            updatedMessage = chalk.red(updatedMessage);
            break;
        }

        default:
            updatedMessage = chalk.blue(updatedMessage);
            break;
    }
    console.log(updatedMessage);
};

export const updateThaproxyNodeServiceRoute = ({
    service,
    status = T_NODE_SERVICE_STATUS.LOCAL,
}: {
    service: keyof typeof NODE_SERVICES;
    status: `${T_NODE_SERVICE_STATUS}`;
}) => {
    switch (status) {
        case T_NODE_SERVICE_STATUS.LOCAL: {
            fs.appendFileSync(DOCXN_SERVICE_ROUTE_CONFIG_FILE, `\n${service}\n`);
            break;
        }

        case T_NODE_SERVICE_STATUS.AWS: {
            let fileContentStr = '';
            // If file does not exists ignore, we will upsert it.
            try {
                fileContentStr = fs.readFileSync(DOCXN_SERVICE_ROUTE_CONFIG_FILE, 'utf-8');
            } catch (error) {
                /* empty */
            }
            const updatedFileContent = fileContentStr
                .replaceAll(new RegExp(`(/\n)*${service}(/\n)*`, 'g'), '')
                // Clear empty new lines
                .replace(/(^[ \t]*\n)/gm, '');
            fs.writeFileSync(DOCXN_SERVICE_ROUTE_CONFIG_FILE, updatedFileContent, 'utf-8');
            break;
        }

        default:
            break;
    }
};

export const getIsTracxnHaproxyUp = () => {
    const PORT = 80;
    const HOST = '127.0.0.1';
    try {
        execSync(
            `
        {
            echo "" > /dev/tcp/${HOST}/${PORT} && echo "Port $PORT is open"
        } &> /dev/null
        if [[ $? == 0 ]]; then
            exit 0;
        else
            exit 1;
        fi
    `,
            {
                encoding: 'utf8',
                stdio: [0, 1, 2],
            },
        );
        logToConsole(`Tracxn's Haproxy is running at ${HOST}:${PORT}`, 'SUCCESS');
        return true;
    } catch (error) {
        /* empty */
    }
    logToConsole(`Tracxn's Haproxy is not running at ${HOST}:${PORT}`, 'ERROR');
    return false;
};

export const startTracxnHaproxy = () => {
    try {
        const osType = platform();
        switch (osType) {
            case 'darwin': {
                execSync('brew services start haproxy', {
                    encoding: 'utf8',
                    stdio: [0, 1, 2],
                });
                break;
            }

            case 'linux': {
                execSync('sudo service haproxy start', {
                    encoding: 'utf8',
                    stdio: [0, 1, 2],
                });
                break;
            }

            default:
                break;
        }
    } catch (error: any) {
        logToConsole(`Error in starting haproxy, message: ${error?.message || ''}`);
        logToConsole('Please start haproxy by using `docxn haproxy start`');
    }
};
