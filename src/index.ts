import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import {
    Context,
    ConnectorError,
    createConnector,
    readConfig,
    logger,
    Response,
    StdAccountCreateInput,
    StdAccountCreateOutput,
    StdAccountListOutput,
    StdAccountReadInput,
    StdAccountReadOutput,
    StdAccountUpdateInput,
    StdAccountUpdateOutput,
    StdEntitlementListOutput,
    StdEntitlementReadOutput,
    StdEntitlementReadInput,
    StdTestConnectionOutput,
    AttributeChangeOp,
    Key,
    SimpleKey,
} from '@sailpoint/connector-sdk';
import { IDNClient } from './idn-client';
import { Account } from './model/account';
import { Group } from './model/group';

// Connector must be exported as module property named connector
export const connector = async () => {
    // Get connector source config
    const config = await readConfig();
    const SLEEP: number = 2000;

    // Use the vendor SDK, or implement own client as necessary, to initialize a client
    const client = new IDNClient(config);

    return createConnector()
        .stdTestConnection(
            async (context: Context, input: undefined, res: Response<StdTestConnectionOutput>) => {
                const response: AxiosResponse = await client.testConnection();
                if (response.status != 200) {
                    throw new ConnectorError('Unable to connect to IdentityNow');
                } else {
                    res.send({});
                }
        })
        .stdAccountList(
            async (context: Context, input: undefined, res: Response<StdAccountListOutput>) => {
                const response1: AxiosResponse = await client.accountAggregation();
                for (const acc of response1.data) {
                    let response2: AxiosResponse = await client.getAccountDetails(acc.name);
                    let account: Account = new Account(response2.data);
                    res.send(account);
                }
        })
        .stdAccountCreate(
            async (context: Context, input: StdAccountCreateInput, res: Response<StdAccountCreateOutput>) => {
                logger.info(JSON.stringify(input));
                const response1 = await client.getAccountDetails(input.identity as string);
                let account: Account = new Account(response1.data);
                if (input.attributes.roles != null) {
                    let values: string[] = [].concat(input.attributes.roles).map((x: string) => x === 'ORG_ADMIN' ? 'ADMIN' : x);
                    for (let value of values) {
                        await client.addEntitlement(account.attributes.id as string, value);
                        await sleep(SLEEP);
                    }
                }
                const response2 = await client.getAccountDetails(input.identity as string);
                account = new Account(response2.data);
                res.send(account);
            }
        )
        .stdAccountRead(
            async (context: Context, input: StdAccountReadInput, res: Response<StdAccountReadOutput>) => {
                logger.info(JSON.stringify(input));
                const response = await client.getAccountDetails(input.identity as string);
                let account: Account = new Account(response.data);
                res.send(account);
        })
        .command('std:account:disable', 
            async (context: Context, input: any, res: Response<any>) => {
                logger.info('std:account:disable');
                logger.info(JSON.stringify(input));
                const response1 = await client.getAccountDetails(input.identity as string);
                let account: Account = new Account(response1.data);
                const response2 = await client.disableAccount(account.attributes.id as string);
                const response3 = await client.getAccountDetails(input.identity as string);
                account = new Account(response3.data);
                res.send(account);
        })
        .command('std:account:enable', 
            async (context: Context, input: any, res: Response<any>) => {
                logger.info(JSON.stringify(input));
                const response1 = await client.getAccountDetails(input.identity as string);
                let account: Account = new Account(response1.data);
                const response2 = await client.enableAccount(account.attributes.id as string);
                const response3 = await client.getAccountDetails(input.identity as string);
                account = new Account(response3.data);
                res.send(account);
        })
        .stdEntitlementList(
            async (context: Context, input: any, res: Response<StdEntitlementListOutput>) => {
            const response: AxiosResponse = await client.groupAggregation();
            for (const gr of response.data) {
                let group: Group = new Group(gr);
                res.send(group as StdEntitlementListOutput);
            }
        })
        .stdEntitlementRead(
            async (context: Context, input: StdEntitlementReadInput, res: Response<StdEntitlementReadOutput>) => {
                logger.info(JSON.stringify(input));
                const response: AxiosResponse = await client.getGroupDetails(input.identity);
                let group: Group = new Group(response.data.pop());
                res.send(group as StdEntitlementListOutput);
            }
        )
        .stdAccountUpdate(
            async (context: Context, input: StdAccountUpdateInput, res: Response<StdAccountUpdateOutput>) => {
                logger.info(JSON.stringify(input));
                const response1 = await client.getAccountDetails(input.identity as string);
                let account: Account = new Account(response1.data);
                for (let change of input.changes) {
                    let values: string[] = [].concat(change.value).map((x: string) => x === 'ORG_ADMIN' ? 'ADMIN' : x);
                    switch (change.op) {
                        case AttributeChangeOp.Add:
                            for (let value of values) {
                                await client.addEntitlement(account.attributes.id as string, value);
                                await sleep(SLEEP);
                            }
                            break;
                        case AttributeChangeOp.Remove:
                            for (let value of values) {
                                await client.removeEntitlement(account.attributes.id as string, value);
                                await sleep(SLEEP);
                            }
                            break;
                        default:
                            throw new ConnectorError(`Operation not supported: ${change.op}`);
                    }
                }

                const response2 = await client.getAccountDetails(input.identity as string);
                account = new Account(response2.data);
                res.send(account);
            }
        );
}

//Looks like /cc/api/user/updatePermissions endpoint needs some cooldown before being called again or requests won't take effect
function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}