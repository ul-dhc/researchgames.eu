import test from 'node:test';
import assert from 'node:assert/strict';
import {makeDeck,createGame,selectCard,resolveMismatch,scoreFor,sampleMeadow,timeBonusFor,shareResultFor} from '../game-model.mjs';
const plants = Array.from({length:8},(_,i)=>({id:`plant-${i}`}));
const ordered = () => plants.flatMap(plant => ['image','name'].map(kind=>({plant,kind})));

test('a meadow samples eight distinct plants from 37 without changing the source',()=>{
  const pool=Array.from({length:37},(_,i)=>({id:`plant-${i}`}));
  const original=pool.map(p=>p.id);
  const meadow=sampleMeadow(pool);
  assert.equal(meadow.length,8);assert.equal(new Set(meadow.map(p=>p.id)).size,8);
  assert.deepEqual(pool.map(p=>p.id),original);
});
test('even an identical random draw cannot repeat the preceding meadow',()=>{
  const pool=Array.from({length:37},(_,i)=>({id:`plant-${i}`}));
  const first=sampleMeadow(pool,8,[],()=>.5);
  const second=sampleMeadow(pool,8,first.map(p=>p.id),()=>.5);
  assert.notDeepEqual(first.map(p=>p.id).sort(),second.map(p=>p.id).sort());
  assert.equal(new Set(second.map(p=>p.id)).size,8);
});
test('an undersized plant collection is rejected',()=>{
  assert.throws(()=>sampleMeadow(plants,9),RangeError);
});

for (const count of [6, 8, 10]) {
  test(`${count} pairs have the correct deck size, completion and score maximum`,()=>{
    const pool=Array.from({length:37},(_,i)=>({id:`plant-${i}`}));
    const meadow=sampleMeadow(pool,count);
    const deck=meadow.flatMap(plant=>['image','name'].map(kind=>({plant,kind})));
    const s=createGame(deck);
    assert.equal(makeDeck(meadow).length,count*2);
    for(let i=0;i<deck.length;i+=2){selectCard(s,i);selectCard(s,i+1);}
    assert.equal(s.pairs,count);assert.equal(s.complete,true);
    assert.equal(scoreFor(s.pairs,s.mistakes),count*100);
  });
}

test('eight plants produce one picture and one name each, including after shuffling',()=>{
  const deck=makeDeck(plants,()=>.27);
  assert.equal(deck.length,16); assert.equal(new Set(deck.map(c=>c.key)).size,16);
  for(const p of plants) assert.deepEqual(deck.filter(c=>c.plant.id===p.id).map(c=>c.kind).sort(),['image','name']);
});
test('repeat click is ignored; matched cards cannot be counted twice',()=>{
  const s=createGame(ordered());
  assert.equal(selectCard(s,0).type,'first'); assert.equal(selectCard(s,0).type,'ignored');
  assert.equal(s.moves,0);assert.equal(selectCard(s,1).type,'match');
  assert.equal(selectCard(s,0).type,'ignored');assert.equal(s.pairs,1);assert.equal(s.moves,1);
});
test('mismatch locks all input until resolution and costs ten points',()=>{
  const s=createGame(ordered()); selectCard(s,0);selectCard(s,2);
  assert.equal(s.mistakes,1);assert.equal(selectCard(s,1).type,'ignored');
  assert.deepEqual(resolveMismatch(s),[0,2]);selectCard(s,0);selectCard(s,1);
  assert.equal(scoreFor(s.pairs,s.mistakes),90);
});
test('perfect completion yields 800, eight moves, and rejects further input',()=>{
  const s=createGame(ordered());let last;
  for(let i=0;i<16;i+=2){selectCard(s,i);last=selectCard(s,i+1);}
  assert.equal(last.complete,true);assert.equal(s.complete,true);assert.equal(s.moves,8);
  assert.equal(scoreFor(s.pairs,s.mistakes),800);assert.equal(selectCard(s,0).type,'ignored');
});
test('score floor does not erase early mismatch penalties',()=>{
  assert.equal(scoreFor(0,4),0);assert.equal(scoreFor(1,4),60);
  assert.equal(scoreFor(8,90),0);assert.equal(scoreFor(8,3),770);
});

test('timed bonus scales with meadow size and decays once per two seconds',()=>{
  assert.equal(timeBonusFor(6,0),150);
  assert.equal(timeBonusFor(8,0),200);
  assert.equal(timeBonusFor(10,0),250);
  assert.equal(timeBonusFor(8,1),200);
  assert.equal(timeBonusFor(8,2),199);
  assert.equal(timeBonusFor(8,40),180);
  assert.equal(timeBonusFor(8,400),0);
  assert.equal(timeBonusFor(8,900),0);
});
test('timed points combine accuracy and speed without erasing mistakes',()=>{
  assert.equal(scoreFor(8,3,timeBonusFor(8,40)),950);
  assert.equal(scoreFor(8,90,timeBonusFor(8,0)),100);
  assert.equal(scoreFor(8,110,timeBonusFor(8,0)),0);
  assert.equal(scoreFor(8,3),770);
});

test('copied meadow includes only enabled metrics', () => {
 const meadow = [{namesLtg:['ašņa zuole']},{namesLtg:['celine']}];
 const base = 'Munā teirumā aug ašņa zuole i celine.';
 assert.equal(shareResultFor(meadow), base);
 assert.equal(shareResultFor(meadow,{time:true,seconds:125}), base+' Es tū atkluoju 2 minute laikā i 5 sekunžu laikā');
 assert.equal(shareResultFor(meadow,{points:true,score:500}), base+' Es dabuoju 500 punktu.');
 assert.equal(shareResultFor(meadow,{time:true,points:true,seconds:60,score:822}), base+' Es tū atkluoju 1 minutis laikā i dabuoju 822 punktus.');
});

test('result duration uses the supplied Latgalian forms', () => {
 for (const [seconds, phrase] of [[34,'34 sekunžu'],[1,'1 sekuņdis'],[11,'11 sekunžu'],[21,'21 sekuņdis'],[120,'2 minute'],[61,'1 minutis i 1 sekuņdis']]) {
  assert.ok(shareResultFor([],{time:true,seconds}).includes(phrase+' laikā'));
 }
});

test('translator placeholders and untranslated fallbacks are preserved', async () => {
 const {t,interfaceStrings}=await import('../translations.mjs');
 assert.equal(t('01.05',{augu_skaits:10}),'Kotrai spēlei ir cyts teirums – 10 augi nu 37.');
 assert.equal(t('05.01',{nosaukums:'asinszāle'}),'latviešu: asinszāle');
 assert.equal(t('06.04'),'Kā spēlēt');
 assert.equal(Object.values(interfaceStrings).filter(x=>x.ltg).length,61);
 for(const id of Object.keys(interfaceStrings)) assert.ok(t(id).length>0);
 assert.ok(!shareResultFor([{namesLtg:['ašņa zuole']}],{time:true,points:true,seconds:34,score:633}).includes('{'));
 assert.ok(!shareResultFor([],{time:true,seconds:120}).includes('laikā laikā'));
});

test('timed score result includes laikā once after seconds', () => {
 const result=shareResultFor([{namesLtg:['ašņa zuole']}],{time:true,points:true,seconds:55,score:633});
 assert.equal(result,'Munā teirumā aug ašņa zuole. Es tū atkluoju 55 sekunžu laikā i dabuoju 633 punktus.');
 assert.ok(!shareResultFor([],{time:true,points:true,seconds:120,score:633}).includes('laikā laikā'));
});

test('plant list joins the last two names with i without a comma', () => {
 const meadow=['peliejs','naktineica','dzeļne'].map(name=>({namesLtg:[name]}));
 assert.equal(shareResultFor(meadow),'Munā teirumā aug peliejs, naktineica i dzeļne.');
 assert.equal(shareResultFor(meadow.slice(1)),'Munā teirumā aug naktineica i dzeļne.');
 assert.equal(shareResultFor(meadow.slice(2)),'Munā teirumā aug dzeļne.');
});
