import { Attributes, StdEntitlementReadOutput } from '@sailpoint/connector-sdk'

export class Group {
    identity: string;
    uuid: string;
    type: string = 'group';
    attributes: Attributes;

    constructor(object: any) {
        this.attributes = {
            name: object.name,
            value: object.value,
            description: object.description
        }
        this.identity = this.attributes.value as string;
        this.uuid = this.attributes.name as string;
    }
}
