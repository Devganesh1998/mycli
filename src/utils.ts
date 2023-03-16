import { InvalidArgumentError } from 'commander';

export const getArgumentValidator = (possibleValues: string[]) => (value: string) => {
    if (!possibleValues.includes(value)) {
        throw new InvalidArgumentError(`Possible values - ${possibleValues.join(', ')}.`);
    }
    return value;
};
