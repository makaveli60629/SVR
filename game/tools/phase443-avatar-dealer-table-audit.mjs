import fs from 'node:fs';

const read = path => fs.readFileSync(path, 'utf8');
const checks = [];
const check = (name, pass, detail = '') => checks.push({ name, pass: Boolean(pass), detail });
const avatarHtml = read('game/labs/avatar/index.html');
const avatarJs = read('game/labs/avatar/avatar-lab.js');
const player = read('game/modules/avatar/player_avatar_module.js');
const catalog = read('site/data/avatar-catalog.json');
const dealerAccess = read('game/labs/dealer/lab-access.js');
const dealerLab = read('game/labs/dealer/dealer-lab-v427.js');
const dealer = read('game/modules/dealer/eric_dealer_module.js');
const table = read('game/modules/phase441_quest_table_clearance_polish.js');
const game = read('game/index.html');
const headsUp = read('game/modules/phase444_heads_up_avatar_demo.js');

check('Eric absent from Avatar Lab', !/Eric|Claudia|eric\.fbx|claudia\.fbx/i.test(avatarHtml + avatarJs + catalog));
check('independent player identity', /avatarRole = 'player'/.test(player) && /SVR_PLAYER_AVATAR_ROOT/.test(player));
check('articulated skeleton', ['Hips','Spine','Chest','Neck','Head','UpperArm','ForeArm','Thigh','Calf','Foot'].every(name => player.includes(name)));
check('no placeholder boxes in player', !/BoxGeometry/.test(player));
check('live motion set', ['idle','walking','running','jump','sitting'].every(name => avatarHtml.includes(`data-motion="${name}"`)));
check('fitted wardrobe set', ['jacket','vest','hoodie','sneakers','boots','watch','chain','badge'].every(name => avatarHtml.includes(`value="${name}"`)));
check('Dealer Lab has one scale authority', !dealerAccess.includes('dealer-scale-authority') && (dealerAccess.match(/dealer-lab-v427/g) || []).length === 1);
check('Eric remains Dealer Lab only', /EricDealerModule/.test(dealerLab) && /PHASE-443-DEALER-LAB-ERIC-VISIBLE/.test(dealerLab));
check('card leaves Eric hand', /detail\.origin/.test(dealerLab) && /getHandWorldPosition\('right'\)/.test(dealer) && /CustomEvent\('deal'/.test(dealer));
check('dealer visibility guard', /this\.group\.visible = true; this\.propGroup\.visible = true/.test(dealer));
check('3.75-inch chip shelf', /CHIP_SHELF_INSET_METERS = 0\.09525/.test(table) && /size\.x \* 0\.5 - CHIP_SHELF_INSET_METERS/.test(table));
check('center logo authoritative', /CENTER_SVR_LOGO/.test(table) && /logo\.png/.test(table) && /logo\.renderOrder = 60/.test(table));
check('production cache advanced', /phase441_quest_table_clearance_polish\.js\?v=phase444/.test(game) && /patch=phase444/.test(game));
check('avatar demonstrates movement', /avatar\.setMotion\('walking'\)/.test(avatarJs));
check('Eric asset cache refreshed', /eric\.fbx.*phase444/.test(dealer));
check('logo forced above felt', /depthTest = false/.test(read('game/labs/dealer/table-surface-authority-phase437.js')) && /renderOrder = 70/.test(read('game/labs/dealer/table-surface-authority-phase437.js')));
check('one heads-up player', /PHASE444_SINGLE_HEADS_UP_PLAYER/.test(headsUp) && /setMotion\('sitting'\)/.test(headsUp) && /addEventListener\('deal', receiveCard\)/.test(headsUp));

for (const item of checks) console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` — ${item.detail}` : ''}`);
const failed = checks.filter(item => !item.pass);
console.log(`\nPhase 443 audit: ${checks.length - failed.length}/${checks.length} checks passed.`);
if (failed.length) process.exit(1);
