import { Attributes, StdAccountReadOutput } from '@sailpoint/connector-sdk'
import { Group } from './group'

export class Account {
    identity: string;
    uuid: string;
    attributes: Attributes;

    constructor(object: any) {
        this.attributes = {
            id: object.id,
            name: object.uid,
            externalId: object.externalId,
            firstName: object.attributes.firstname,
            lastName: object.attributes.lastname,
            displayName: object.name,
            enabled: object.enabled,
            roles: object.role
        };
        this.identity = this.attributes.name as string;
        this.uuid = this.attributes.name as string;
    }
}
