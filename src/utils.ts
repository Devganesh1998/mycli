import { platform } from 'os';
import { execSync } from 'child_process';
import { InvalidArgumentError } from 'commander';
import fs from 'fs';
import { DOCXN_SERVICE_ROUTE_CONFIG_FILE, T_NODE_SERVICE_STATUS, NODE_SERVICES } from './constants';

export const getArgumentValidator = (possibleValues: string[]) => (value: string) => {
    if (!possibleValues.includes(value)) {
        throw new InvalidArgumentError(`Possible values - ${possibleValues.join(', ')}.`);
    }
    return value;
};

export const logToConsole = (message: string) => {
    console.log(`\nmycli: ${message}.`);
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
    try {
        execSync(
            `
        PORT=80
        HOST="127.0.0.1"
        {
            echo "" > /dev/tcp/$HOST/$PORT && echo "Port $PORT is open"
        } &> /dev/null
        if [[ $? == 0 ]]; then
            echo "\nmycli: Haproxy is running at \${HOST}:\${PORT}."
            exit 0;
        else
            echo "\nmycli: Haproxy is not running at \${HOST}:\${PORT}."
            exit 1;
        fi
    `,
            {
                encoding: 'utf8',
                stdio: [0, 1, 2],
            },
        );
        return true;
    } catch (error) {
        /* empty */
    }
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
