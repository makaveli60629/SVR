import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const json = (p) => JSON.parse(read(p));
const fail = (message) => { throw new Error(message); };
const need = (condition, message) => { if (!condition) fail(message); };

const contract = json('api/database-contract.json');
const apiServer = read('api/server.js');
const playerConfig = json('site/config/player-api.json');
const tournamentConfig = json('game/config/tournament-api.json');
const awsFoundation = read('infrastructure/aws/phase372-player-account-foundation.yml');
const accountClient = read('site/js/phase345-player-account-client.js');

need(contract.contractVersion >= 1, 'database contract version missing');
need(!apiServer.includes('ADMIN_PASSWORD'), 'api/server.js must not authenticate with ADMIN_PASSWORD');
need(!apiServer.includes('CHANGE_ME_DEV_ONLY'), 'development JWT fallback must not exist');
need(!/detail:\s*error\.message/.test(apiServer), 'raw error.message detail leak remains');
need(apiServer.includes('password_hash = crypt($2, password_hash)'), 'database-hash admin login authority missing');
need(apiServer.includes('/api/admin/database/schema'), 'protected schema audit route missing');
need(apiServer.includes('ensureSiteAdminSchema'), 'startup schema bootstrap missing');

for (const [table, columns] of Object.entries(contract.siteAdminPostgres.tables)) {
  need(apiServer.includes(table), `site/admin table not referenced by server: ${table}`);
  for (const column of columns) {
    need(apiServer.includes(column), `required site/admin field missing from server source: ${table}.${column}`);
  }
}

need(playerConfig.provider === 'aws', 'player provider must remain aws until explicitly migrated');
need(playerConfig.identity === 'cognito', 'AWS player identity must be Cognito');
need(playerConfig.database === 'dynamodb', 'AWS player database must be DynamoDB');
need(Boolean(String(playerConfig.apiBase || '').trim()) === Boolean(playerConfig.accountApiEndpointConfigured),
  'player apiBase/accountApiEndpointConfigured mismatch');
if (!playerConfig.accountApiEndpointConfigured) {
  need(playerConfig.deploymentState === 'cloud-endpoint-pending', 'unconfigured player API must remain cloud-endpoint-pending');
}

const profileFields = contract.playerAws.profileTable.requiredFields;
const sessionFields = contract.playerAws.sessionTable.requiredFields;
for (const field of ['playerId','displayName','email','role','playMoney','dailyStreak','lastRewardClaim','avatarUrl','equippedOutfit','inventory','createdAt','lastLoginAt']) {
  need(profileFields.includes(field), `player profile contract missing browser field: ${field}`);
  need(accountClient.includes(field), `browser account client no longer references expected profile field: ${field}`);
}
for (const field of ['sessionId','platform','startedAt','lastHeartbeatAt','activeSeconds','heartbeatCount','endedAt']) {
  need(sessionFields.includes(field), `player session contract missing browser field: ${field}`);
  need(accountClient.includes(field), `browser account client no longer references expected session field: ${field}`);
}

for (const token of ['AWS::Cognito::UserPool','AWS::DynamoDB::Table','playerId','normalizedEmail','sessionId','expiresAt','player-started-at']) {
  need(awsFoundation.includes(token), `AWS foundation missing required token: ${token}`);
}

need(Boolean(String(tournamentConfig.apiBase || '').trim()) === Boolean(tournamentConfig.endpointConfigured),
  'tournament apiBase/endpointConfigured mismatch');
if (!tournamentConfig.endpointConfigured) {
  need(tournamentConfig.sharedRegistrationBackendLive === false, 'shared tournament backend cannot be live without endpoint');
  need(tournamentConfig.backgroundPushLive === false, 'background push cannot be live without endpoint');
}

console.log(JSON.stringify({
  ok: true,
  contractVersion: contract.contractVersion,
  siteAdminTables: Object.keys(contract.siteAdminPostgres.tables).length,
  playerProfileFields: profileFields.length,
  playerSessionFields: sessionFields.length,
  playerRemoteEndpoint: playerConfig.accountApiEndpointConfigured ? 'configured' : 'pending',
  tournamentRemoteEndpoint: tournamentConfig.endpointConfigured ? 'configured' : 'pending'
}, null, 2));
