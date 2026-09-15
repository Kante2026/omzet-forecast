// Isolated browser test: all database operations are intercepted in memory.
const puppeteer = require('puppeteer');
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const mock = `
window.testDb={werkelijk:[{id:'w1',jaar:2026,projectnummer:'TEST',opdrachtgever:'Testklant',hoeveelheid:10,eenheid:'ton',tarief:10,omzet:100,marge:10,maand:'december',afgerond:false,verdeling:null}],forecast:[]};
window.failSave=false;
class Query {
 constructor(table){this.table=table;this.op='select';}
 select(){return this;} order(){return this;} range(){return this;}
 eq(k,v){this.filter=[k,v];return this;}
 update(row){this.op='update';this.row=row;return this;}
 insert(row){this.op='insert';this.row=row;return this;}
 delete(){this.op='delete';return this;}
 then(resolve,reject){return Promise.resolve().then(()=>{
  if(window.failSave&&this.op!=='select')return {error:{message:'Test database failure'},data:null};
  let data=window.testDb[this.table];
  const matches=r=>!this.filter||r[this.filter[0]]===this.filter[1];
  if(this.op==='update'){data=data.filter(matches);data.forEach(r=>Object.assign(r,this.row));}
  if(this.op==='insert'){const row={id:crypto.randomUUID(),...this.row};window.testDb[this.table].push(row);data=[row];}
  if(this.op==='delete'){window.testDb[this.table]=data.filter(r=>!matches(r));data=[];}
  return {data:structuredClone(data),error:null};
 }).then(resolve,reject);}
}
const channel={on(){return this},subscribe(){return this},presenceState(){return {}},track(){return Promise.resolve()},untrack(){return Promise.resolve()}};
window.supabase={createClient:()=>({auth:{getSession:async()=>({data:{session:{user:{email:'b.groot@grobagroep.nl',user_metadata:{name:'Bouwe'}}}}}),onAuthStateChange(){},signOut:async()=>({})},from:t=>new Query(t),channel:()=>channel,removeChannel(){}})};
`;
(async()=>{
 const browser=await puppeteer.launch({headless:true,executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try {
  const page=await browser.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.setRequestInterception(true);
  page.on('request',r=>{
   if(r.url().includes('cdn.jsdelivr.net/npm/@supabase/'))return r.respond({contentType:'application/javascript',body:mock});
   if(r.url().includes('supabase.co'))return r.abort();
   return r.continue();
  });
  await page.goto(pathToFileURL(path.resolve(__dirname,'../index.html')).href);
  await page.waitForFunction(()=>document.querySelector('#werkelijkBody').textContent.includes('TEST'));
  await page.evaluate(()=>toggleCompleted('w1'));
  assert.equal(await page.evaluate(()=>testDb.werkelijk[0].afgerond),true);
  assert.ok((await page.$eval('#summaryGrid',e=>e.textContent)).includes('100'));
  await page.evaluate(async()=>{await loadData();render()});
  assert.ok((await page.$eval('#werkelijkBody',e=>e.textContent)).includes('Heropen project'));
  await page.evaluate(()=>toggleCompleted('w1'));
  assert.equal(await page.evaluate(()=>testDb.werkelijk[0].afgerond),false);
  await page.evaluate(()=>editDistribution('werkelijk','w1'));
  await page.$eval('#splitStart',e=>e.value='2026-12');
  await page.$eval('#splitEnd',e=>e.value='2027-02');
  await page.evaluate(()=>distributeDraft());
  await page.evaluate(()=>saveEntry({preventDefault(){}}));
  assert.equal(await page.evaluate(()=>testDb.werkelijk[0].verdeling.length),3);
  await page.select('#yearSelect','2027');
  assert.ok((await page.$eval('#werkelijkBody',e=>e.textContent)).includes('januari, februari'));
  await page.select('#periodView','quarter');
  assert.ok((await page.$eval('#summaryHeading',e=>e.textContent)).includes('kwartaal'));
  assert.equal(await page.evaluate(()=>chart.config.data.datasets[0].data[0]),66.67);
  await page.evaluate(()=>openModal('forecast'));
  assert.equal(await page.$eval('#entryType',e=>e.value),'forecast');
  await page.evaluate(()=>{fProject.value='JAN2027';fClient.value='Nieuwe klant';fQuantity.value='2';fRate.value='50';fMargin.value='20';fYear.value='2027';fMonth.value='januari';fChance.value='0'});
  await page.evaluate(()=>saveEntry({preventDefault(){}}));
  assert.equal(await page.evaluate(()=>testDb.forecast[0].jaar),2027);
  assert.equal(await page.evaluate(()=>testDb.forecast[0].kans),0);
  assert.equal(await page.evaluate(()=>chart.config.data.datasets[2].data[0]),0);
  // Conversion must preserve the original year and complete cross-year schedule.
  page.on('dialog',dialog=>dialog.accept());
  await page.evaluate(()=>convertToForecast('w1'));
  assert.equal(await page.evaluate(()=>testDb.forecast.find(r=>r.projectnummer==='TEST').verdeling.length),3);
  await page.evaluate(()=>convertToWerkelijk(testDb.forecast.find(r=>r.projectnummer==='TEST').id));
  await page.evaluate(()=>{const r=testDb.werkelijk.find(r=>r.projectnummer==='TEST');r.id='w1';});
  await page.evaluate(async()=>{await loadData();render()});
  assert.equal(await page.evaluate(()=>testDb.werkelijk[0].jaar),2026);
  assert.equal(await page.evaluate(()=>chart.config.data.datasets[0].data[0]),66.67);
  await page.evaluate(()=>{editEntry('werkelijk','w1');allocationsDraft[0].omzet+=1});
  await page.evaluate(()=>saveEntry({preventDefault(){}}));
  assert.equal(await page.$eval('#modalOverlay',e=>e.classList.contains('active')),true);
  assert.ok((await page.$eval('#toast',e=>e.textContent)).includes('exact gelijk'));
  await page.evaluate(()=>{allocationsDraft[0].omzet-=1;window.failSave=true});
  await page.evaluate(()=>saveEntry({preventDefault(){}}));
  assert.equal(await page.$eval('#modalOverlay',e=>e.classList.contains('active')),true);
  assert.equal(await page.$eval('#entryForm button[type=submit]',e=>e.disabled),false);
  await page.evaluate(()=>{window.failSave=false;closeModal()});
  await page.setViewport({width:390,height:844});
  await page.waitForFunction(()=>getComputedStyle(document.querySelector('#modalOverlay')).opacity==='0');
  await page.evaluate(()=>document.getElementById('toast').className='toast');
  await new Promise(resolve=>setTimeout(resolve,350));
  await page.screenshot({path:path.resolve(__dirname,'../test-mobile.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('Browser tests passed: completion/reopen/reload, split/year/quarter totals, new January 2027 forecast, zero chance, invalid totals, failed save, mobile render. No live database used.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
