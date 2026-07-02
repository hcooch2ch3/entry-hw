'use strict';
const assert = require('assert');
// Requiring the module also proves raccoon.js loads cleanly (syntax + structure).
const raccoon = require('../app/modules/raccoon.js');

// Raccoon handshake: model token "30" (roboid RaccoonConnectionChecker: info[2] === "30").
// Name-independent parse (matches hamster_s/pio): model/variant/address taken from the END.
// cfg.id here is the parser-layer id ('0230' + variant), mutated by checkInitialData.

function check(input, label, expectId, expectAddr) {
    const cfg = {};
    const r = raccoon.checkInitialData(input, cfg);
    assert.strictEqual(r, true, label + ' must handshake-OK (got ' + r + ')');
    assert.strictEqual(cfg.id, expectId, label + ' id');
    assert.strictEqual(raccoon.address, expectAddr, label + ' address');
}
function checkFail(input, label) {
    const cfg = {};
    const r = raccoon.checkInitialData(input, cfg);
    assert.notStrictEqual(r, true, label + ' must NOT handshake-OK (got ' + r + ')');
}

// real capture-style formats
check('FF01,Raccoon,30,00,534896FC3CC5', 'ASCII name', '023000', '534896FC3CC5');
check('FF01,,30,01,C62AFCA68AF1', 'empty name', '023001', 'C62AFCA68AF1');
check('FF01,라쿤,30,00,534896FC3CC5', 'Korean name', '023000', '534896FC3CC5');

// user-arbitrary names: delimiter injection must not break tail parsing
check('FF01,Robot, v2,30,00,534896FC3CC5', 'comma in name', '023000', '534896FC3CC5');
check('FF01,Rac\rX,30,00,534896FC3CC5\r', 'CR in name', '023000', '534896FC3CC5');
check('FF01,Rac\nX,30,00,534896FC3CC5', 'LF in name', '023000', '534896FC3CC5');
check('FF01,Raccoon,30,00,534896FC3CC5\r\n', 'CRLF terminator', '023000', '534896FC3CC5');
check('FF01,浣熊,30,00,534896FC3CC5', 'Chinese', '023000', '534896FC3CC5');
check('FF01,🦝ラクーン,30,00,534896FC3CC5', 'emoji+JP', '023000', '534896FC3CC5');
check('FF01,浣,熊,30,00,534896FC3CC5', 'CJK + comma', '023000', '534896FC3CC5');

// negative cases: reject without crashing (wrong-robot tokens on the shared dongle)
checkFail('FF01,name,04,00,534896FC3CC5', 'wrong model (hamster 04)');
checkFail('FF01,name,0E,00,534896FC3CC5', 'wrong model (hamsterS 0E)');
checkFail('FF01,name,20,00,534896FC3CC5', 'wrong model (pio 20)');
checkFail('FF01,name,30,00,123', 'short address');
checkFail('FF01,name,30', 'partial frame');
checkFail('AB01,name,30,00,534896FC3CC5', 'non-FF prefix');

// structural corruption must NOT heal
checkFail('FF01,name,3\r0,00,534896FC3CC5', 'CR-corrupted model must NOT heal to 30');
checkFail('FF01,name,30,0\r0,534896FC3CC5', 'CR-corrupted variant');
checkFail('FF01,name,30,XY,534896FC3CC5', 'non-hex variant');
checkFail('FF01,name,30,,534896FC3CC5', 'empty variant');
checkFail('FF01,name,30,00,534896FC3CC5junk', 'address suffix junk');
checkFail('FF01,name,30,00,ZZZZZZZZZZZZ', 'non-hex address');

// lowercase hex accepted verbatim (policy fixed, matches hamster/pio spec)
check('FF01,name,30,0a,abcdef012345', 'lowercase hex accepted verbatim', '02300a', 'abcdef012345');

// non-string / null: typeof guard, no throw
checkFail(12345, 'non-string input (number)');
checkFail(null, 'null input');

console.log('handshake_parse_raccoon.spec OK');
