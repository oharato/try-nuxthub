// Node 24 native .env loader
if (typeof process.loadEnvFile === 'function') {
  try { process.loadEnvFile('.env') } catch {}
  try { process.loadEnvFile('../.env') } catch {}
}

import * as pulumi from '@pulumi/pulumi'
import * as cloudflare from '@pulumi/cloudflare'

// Read credentials from .env or Pulumi config
const config = new pulumi.Config()
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || config.get('accountId')
const apiToken = process.env.CLOUDFLARE_API_TOKEN || config.get('apiToken')

if (!accountId) {
  throw new Error('Cloudflare Account ID is required. Please set CLOUDFLARE_ACCOUNT_ID in infra/.env')
}
if (!apiToken) {
  throw new Error('Cloudflare API Token is required. Please set CLOUDFLARE_API_TOKEN in infra/.env')
}

// Explicit Provider configured with the API token
const provider = new cloudflare.Provider('cloudflare', {
  apiToken: apiToken
})

const projectName = pulumi.getProject()
const stackName = pulumi.getStack()

const prefix = `${projectName}-${stackName}`

// 1. Cloudflare D1 Database (SQLite on Edge)
const database = new cloudflare.D1Database('db', {
  accountId: accountId,
  name: `${prefix}-d1`
}, { provider })

// 2. Cloudflare KV Namespace (Key-Value)
const kvNamespace = new cloudflare.WorkersKvNamespace('kv', {
  accountId: accountId,
  title: `${prefix}-kv`
}, { provider })

// 3. Cloudflare R2 Bucket (Object Storage / Blob)
const r2Bucket = new cloudflare.R2Bucket('blob', {
  accountId: accountId,
  name: `${prefix}-blob`,
  location: 'APAC' // optional: ENAM, WNAM, APAC, EEUR, WEUR
}, { provider })

// 4. Cloudflare Pages Project
const pagesProject = new cloudflare.PagesProject('pages', {
  accountId: accountId,
  name: prefix,
  productionBranch: 'main'
}, { provider })

// Export provisioned resource IDs & URLs
export const d1DatabaseId = database.id
export const d1DatabaseName = database.name
export const kvNamespaceId = kvNamespace.id
export const r2BucketName = r2Bucket.name
export const pagesUrl = pagesProject.subdomain.apply((sub: string) => `https://${sub}.pages.dev`)
