import { InvalidArgumentError } from 'commander';
import fs from 'fs';
import { DOCXN_SERVICE_ROUTE_CONFIG_FILE, T_NODE_SERVICE_STATUS, NODE_SERVICES } from './constants';

export const getArgumentValidator = (possibleValues: string[]) => (value: string) => {
    if (!possibleValues.includes(value)) {
        throw new InvalidArgumentError(`Possible values - ${possibleValues.join(', ')}.`);
    }
    return value;
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
