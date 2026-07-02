'use strict';
const assert = require('assert');
// Requiring the module also proves pio.js loads cleanly (syntax + structure).
const pio = require('../app/modules/pio.js');

// Pio handshake: model token "20" (roboid PioConnectionChecker: info[2] === "20").
// Name-independent parse (matches hamster_s): model/variant/address taken from the END.
// cfg.id here is the parser-layer id ('0220' + variant), mutated by checkInitialData.

function check(input, label, expectId, expectAddr) {
    const cfg = {};
    const r = pio.checkInitialData(input, cfg);
    assert.strictEqual(r, true, label + ' must handshake-OK (got ' + r + ')');
    assert.strictEqual(cfg.id, expectId, label + ' id');
    assert.strictEqual(pio.address, expectAddr, label + ' address');
}
function checkFail(input, label) {
    const cfg = {};
    const r = pio.checkInitialData(input, cfg);
    assert.notStrictEqual(r, true, label + ' must NOT handshake-OK (got ' + r + ')');
}

// real capture-style formats
check('FF01,Pio,20,00,534896FC3CC5', 'ASCII name', '022000', '534896FC3CC5');
check('FF01,,20,01,C62AFCA68AF1', 'empty name', '022001', 'C62AFCA68AF1');
check('FF01,삐오,20,00,534896FC3CC5', 'Korean name', '022000', '534896FC3CC5');

// user-arbitrary names: delimiter injection must not break tail parsing
check('FF01,Robot, v2,20,00,534896FC3CC5', 'comma in name', '022000', '534896FC3CC5');
check('FF01,Pio\rX,20,00,534896FC3CC5\r', 'CR in name', '022000', '534896FC3CC5');
check('FF01,Pio\nX,20,00,534896FC3CC5', 'LF in name', '022000', '534896FC3CC5');
check('FF01,Pio,20,00,534896FC3CC5\r\n', 'CRLF terminator', '022000', '534896FC3CC5');
check('FF01,机器人,20,00,534896FC3CC5', 'Chinese', '022000', '534896FC3CC5');
check('FF01,🤖ロボ,20,00,534896FC3CC5', 'emoji+JP', '022000', '534896FC3CC5');
check('FF01,机器,人,20,00,534896FC3CC5', 'CJK + comma', '022000', '534896FC3CC5');

// negative cases: reject without crashing
checkFail('FF01,name,04,00,534896FC3CC5', 'wrong model (hamster 04)');
checkFail('FF01,name,0E,00,534896FC3CC5', 'wrong model (hamsterS 0E)');
checkFail('FF01,name,20,00,123', 'short address');
checkFail('FF01,name,20', 'partial frame');
checkFail('AB01,name,20,00,534896FC3CC5', 'non-FF prefix');

// structural corruption must NOT heal
checkFail('FF01,name,2\r0,00,534896FC3CC5', 'CR-corrupted model must NOT heal to 20');
checkFail('FF01,name,20,0\r0,534896FC3CC5', 'CR-corrupted variant');
checkFail('FF01,name,20,XY,534896FC3CC5', 'non-hex variant');
checkFail('FF01,name,20,,534896FC3CC5', 'empty variant');
checkFail('FF01,name,20,00,534896FC3CC5junk', 'address suffix junk');
checkFail('FF01,name,20,00,ZZZZZZZZZZZZ', 'non-hex address');

// lowercase hex accepted verbatim (policy fixed, matches hamster spec)
check('FF01,name,20,0a,abcdef012345', 'lowercase hex accepted verbatim', '02200a', 'abcdef012345');

// non-string / null: typeof guard, no throw
checkFail(12345, 'non-string input (number)');
checkFail(null, 'null input');

console.log('handshake_parse_pio.spec OK');
