import { arch, platform } from 'os';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { InvalidArgumentError } from 'commander';
import fs from 'fs';
import {
    DOCXN_SERVICE_ROUTE_CONFIG_FILE,
    T_NODE_SERVICE_STATUS,
    NODE_SERVICES,
    T_HAPROXY_ACTIONS,
    TRACXN_DEV_CLOUD_IP,
    T_HAPROXY_CONFIG_TEMPLATE_PATH,
    T_HAPROXY_CONFIG_REF_PATH,
    T_HAPROXY_INSTALLATION_PATH,
} from './constants';

const getHaproxyConfigPath = () => {
    const osType = platform();
    let configPath = '';
    const fileName = 'haproxy.cfg';
    switch (osType) {
        case 'darwin':
            configPath = ['arm', 'arm64'].includes(arch())
                ? `${T_HAPROXY_INSTALLATION_PATH.MAC}${fileName}`
                : `${T_HAPROXY_INSTALLATION_PATH.INTEL_MAC}${fileName}`;
            break;

        case 'linux':
            configPath = `${T_HAPROXY_INSTALLATION_PATH.LINUX}${fileName}`;
            break;

        default:
            break;
    }
    return configPath;
};

const writeFileAsync = (
    path: fs.PathOrFileDescriptor,
    data: string | NodeJS.ArrayBufferView,
    options: fs.WriteFileOptions,
) =>
    new Promise((res, rej) => {
        fs.writeFile(path, data, options, err => {
            if (err) {
                rej(err);
            }
            res(true);
        });
    });

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
    try {
        const baseConfig = {
            'analog.ip': TRACXN_DEV_CLOUD_IP,
            'analog.port': 80,
            'analog.isBackupEnabled': '#',
            'unity.ip': TRACXN_DEV_CLOUD_IP,
            'unity.port': 80,
            'unity.isBackupEnabled': '#',
            'widget.ip': TRACXN_DEV_CLOUD_IP,
            'widget.port': 80,
            'widget.isBackupEnabled': '#',
            'nfs.ip': TRACXN_DEV_CLOUD_IP,
            'nfs.port': 80,
            'nfs.isBackupEnabled': '#',
            'auth.ip': TRACXN_DEV_CLOUD_IP,
            'auth.port': 80,
            'auth.isBackupEnabled': '#',
            'platform.ip': TRACXN_DEV_CLOUD_IP,
            'platform.port': 80,
            'platform.isBackupEnabled': '#',
            'crm.ip': TRACXN_DEV_CLOUD_IP,
            'crm.port': 80,
            'crm.isBackupEnabled': '#',
            'user.ip': TRACXN_DEV_CLOUD_IP,
            'user.port': 80,
            'user.isBackupEnabled': '#',
            'nps.ip': TRACXN_DEV_CLOUD_IP,
            'nps.port': 80,
            'nps.isBackupEnabled': '#',
            'search.ip': TRACXN_DEV_CLOUD_IP,
            'search.port': 80,
            'search.isBackupEnabled': '#',
            'fabric.ip': TRACXN_DEV_CLOUD_IP,
            'fabric.port': 80,
            'fabric.isBackupEnabled': '#',
            'flock.ip': TRACXN_DEV_CLOUD_IP,
            'flock.port': 80,
            'flock.isBackupEnabled': '#',
            'seo.ip': TRACXN_DEV_CLOUD_IP,
            'seo.port': 80,
            'seo.isBackupEnabled': '#',
            'data.ip': TRACXN_DEV_CLOUD_IP,
            'data.port': 80,
            'data.isBackupEnabled': '#',
            'socket.ip': TRACXN_DEV_CLOUD_IP,
            'socket.port': 80,
            'socket.isBackupEnabled': '#',
            host: '127.0.0.1',
            domain: 'devloc.in',
            errorpath: '/opt/homebrew/etc/errors',
        };

        switch (status) {
            case T_NODE_SERVICE_STATUS.LOCAL: {
                fs.appendFileSync(DOCXN_SERVICE_ROUTE_CONFIG_FILE, `\n${service}`);
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

        const locallyRunningServices =
            (fs
                .readFileSync(DOCXN_SERVICE_ROUTE_CONFIG_FILE, 'utf-8')
                ?.split('\n') as (keyof typeof NODE_SERVICES)[]) || [];
        const updatedConfig = locallyRunningServices
            .filter(val => Object.keys(NODE_SERVICES).includes(val))
            .reduce((acc, curr) => {
                return {
                    ...acc,
                    [`${curr}.ip`]: '127.0.0.1',
                    [`${curr}.port`]: NODE_SERVICES[curr].PORT,
                };
            }, []) as unknown as Record<string, string | number>;
        const finalConfig = {
            ...baseConfig,
            ...updatedConfig,
        } as Record<string, string | number>;
        const haproxyConfigTemplate = fs.readFileSync(T_HAPROXY_CONFIG_TEMPLATE_PATH, 'utf-8');
        const updatedHaproxyConfig = haproxyConfigTemplate.replace(/%\([a-zA-Z0-9_.]+\)s/g, (match = '') => {
            const configKey = match.substring(2, match.length - 2);
            return `${finalConfig[configKey]}` || match;
        });
        fs.writeFileSync(T_HAPROXY_CONFIG_REF_PATH, updatedHaproxyConfig, 'utf-8');
        fs.writeFileSync(getHaproxyConfigPath(), updatedHaproxyConfig, 'utf-8');
        logToConsole(`Updated the haproxy config to route ${service} requests to ${status}`, 'INFO');
        // await Promise.all([
        //     writeFileAsync(T_HAPROXY_CONFIG_REF_PATH, updatedHaproxyConfig, 'utf-8'),
        //     writeFileAsync(getHaproxyConfigPath(), updatedHaproxyConfig, 'utf-8'),
        // ]);
    } catch (error: any) {
        logToConsole(`Failed to update haproxy route config, errMsg: ${error.message || ''}`, 'ERROR');
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

export const handleTracxnHaproxy = (action = T_HAPROXY_ACTIONS.RELOAD) => {
    try {
        const osType = platform();
        const isStartAction = action === T_HAPROXY_ACTIONS.START;
        switch (osType) {
            case 'darwin': {
                execSync(`brew services ${isStartAction ? 'start' : 'reload'} haproxy`, {
                    encoding: 'utf8',
                    stdio: [0, 1, 2],
                });
                break;
            }

            case 'linux': {
                execSync(`sudo service haproxy ${isStartAction ? 'start' : 'reload'}`, {
                    encoding: 'utf8',
                    stdio: [0, 1, 2],
                });
                break;
            }

            default:
                break;
        }
        logToConsole(
            `Tracxn's Haproxy has now ${isStartAction ? 'started' : 'reloaded with updated config'}`,
            'SUCCESS',
        );
    } catch (error: any) {
        logToConsole(`Error in starting haproxy, message: ${error?.message || ''}`);
        logToConsole('Please start haproxy by using `docxn haproxy start`');
    }
};
