import { ConnectorError, StdTestConnectionOutput } from '@sailpoint/connector-sdk'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

export class IDNClient {
    private readonly idnUrl?: string
    private readonly patId?: string
    private readonly patSecret?: string
    private accessToken?: string
    private expiryDate: Date

    constructor(config: any) {
        this.idnUrl = config.idnUrl
        this.patId = config.patId
        this.patSecret = config.patSecret
        this.expiryDate = new Date()
    }

    async getAccessToken(): Promise<string | undefined> {
        const url: string = `${this.idnUrl}/oauth/token`
        if (new Date() >= this.expiryDate) {
            const request: AxiosRequestConfig = {
                method: 'post',
                baseURL: url,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                params: {
                    client_id: this.patId,
                    client_secret: this.patSecret,
                    grant_type: 'client_credentials',
                },
            }
            const response: AxiosResponse = await axios(request)
            this.accessToken = response.data.access_token
            this.expiryDate = new Date()
            this.expiryDate.setSeconds(this.expiryDate.getSeconds() + response.data.expires_in)
        }

        return this.accessToken
    }

    async testConnection(): Promise<AxiosResponse> {
        const accessToken = await this.getAccessToken()
        const url: string = `${this.idnUrl}/beta/public-identities-config`

        let request: AxiosRequestConfig = {
            method: 'get',
            baseURL: url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        }

        return axios(request)
    }

    async accountAggregation(): Promise<AxiosResponse> {
        const accessToken = await this.getAccessToken()
        const url: string = `${this.idnUrl}/v3/search`

        let request: AxiosRequestConfig = {
            method: 'post',
            baseURL: url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            params: {
                limit: 10000,
            },
            data: {
                query: {
                    query: '@access(source.name.exact:IdentityNow)',
                },
                indices: ['identities'],
                includeNested: false,
                queryResultFilter: {
                    includes: ['name'],
                },
            },
        }

        return await axios(request)
    }

    async getAccountDetails(name: string): Promise<AxiosResponse> {
        const accessToken = await this.getAccessToken()
        const url: string = `${this.idnUrl}/v2/identities/${name}`

        let request: AxiosRequestConfig = {
            method: 'get',
            baseURL: url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            params: null,
            data: null,
        }

        return await axios(request)
    }

    async groupAggregation(): Promise<AxiosResponse> {
        const accessToken = await this.getAccessToken()
        const url: string = `${this.idnUrl}/v3/search`

        let request: AxiosRequestConfig = {
            method: 'post',
            baseURL: url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            params: null,
            data: {
                query: {
                    query: 'source.name.exact:IdentityNow AND attribute:assignedGroups',
                },
                indices: ['entitlements'],
                includeNested: false,
                sort: ['name'],
            },
        }

        return await axios(request)
    }

    async getGroupDetails(id: string): Promise<AxiosResponse> {
        const accessToken = await this.getAccessToken()
        const url: string = `${this.idnUrl}/v3/search`

        let request: AxiosRequestConfig = {
            method: 'post',
            baseURL: url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            params: null,
            data: {
                query: {
                    query: `source.name.exact:IdentityNow AND attribute:assignedGroups AND value:${id}`,
                },
                indices: ['entitlements'],
                includeNested: false,
                sort: ['name'],
            },
        }

        return await axios(request)
    }

    async enableAccount(id: string): Promise<AxiosResponse> {
        const accessToken = await this.getAccessToken()
        const url: string = `${this.idnUrl}/cc/api/user/enabled`

        let request: AxiosRequestConfig = {
            method: 'post',
            baseURL: url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            params: {
                ids: id,
                enabled: true,
            },
            data: null,
        }

        return await axios(request)
    }

    async disableAccount(id: string): Promise<AxiosResponse> {
        const accessToken = await this.getAccessToken()
        const url: string = `${this.idnUrl}/cc/api/user/enabled`

        let request: AxiosRequestConfig = {
            method: 'post',
            baseURL: url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
            },
            params: {
                ids: id,
                enabled: false,
            },
            data: null,
        }

        return await axios(request)
    }

    async addEntitlement(id: string, entitlement: string): Promise<AxiosResponse> {
        const accessToken = await this.getAccessToken()
        const url: string = `${this.idnUrl}/cc/api/user/updatePermissions`

        let request: AxiosRequestConfig = {
            method: 'post',
            baseURL: url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            params: null,
            data: {
                ids: id,
                isAdmin: '1',
                adminType: entitlement,
            },
        }

        return await axios(request)
    }

    async removeEntitlement(id: string, entitlement: string): Promise<AxiosResponse> {
        const accessToken = await this.getAccessToken()
        const url: string = `${this.idnUrl}/cc/api/user/updatePermissions`

        let request: AxiosRequestConfig = {
            method: 'post',
            baseURL: url,
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            params: null,
            data: {
                ids: id,
                isAdmin: '0',
                adminType: entitlement,
            },
        }

        return await axios(request)
    }
}
