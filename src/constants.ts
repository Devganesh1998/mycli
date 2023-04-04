import path from 'path';
import { homedir } from 'os';

export const NODE_SERVICES = {
    analog: {
        path: '~/tracxn/node/services/analog',
        PORT: 10010,
    },
    crm: {
        path: '~/tracxn/node/services/crm',
        PORT: 10011,
    },
    flock: {
        path: '~/tracxn/node/services/flock',
        PORT: 10009,
    },
    fabric: {
        path: '~/tracxn/node/services/next/packages/fabric',
        PORT: 10008,
    },
    seo: {
        path: '~/tracxn/node/services/next/packages/seo',
        PORT: 10012,
    },
    nfs: {
        path: '~/tracxn/node/services/NFS',
        PORT: 10007,
    },
    nps: {
        path: '~/tracxn/node/services/NPS',
        PORT: 10006,
    },
    unity: {
        path: '~/tracxn/node/services/unity',
        PORT: 10013,
    },
};

export const DEFAULT_DATABASE = 'tracxndev';

export const TRACXN_DEV_CLOUD_IP = '13.127.196.65';

export const DOCXN_SERVICE_ROUTE_CONFIG_FILE = path.resolve(homedir(), 'tracxn/docxn/localRunningServices');

export const T_HAPROXY_CONFIG_TEMPLATE_PATH = path.resolve(
    homedir(),
    'tracxn/infra/scripts/docxn/haproxy/data/share/system/haproxy.cfg.template',
);

export const T_HAPROXY_CONFIG_REF_PATH = path.resolve(
    homedir(),
    'tracxn/infra/scripts/docxn/haproxy/data/share/system/haproxy.cfg',
);

export enum T_NODE_SERVICE_STATUS {
    LOCAL = 'LOCAL',
    AWS = 'AWS',
}

export enum T_HAPROXY_INSTALLATION_PATH {
    LINUX = '/etc/haproxy/',
    MAC = '/opt/homebrew/etc/',
    INTEL_MAC = '/usr/local/etc/',
}

export enum T_HAPROXY_ACTIONS {
    START = 'START',
    RELOAD = 'RELOAD',
}

export const DOCXN_PATH = '~/tracxn/infra/scripts/docxn/docxn.py';
