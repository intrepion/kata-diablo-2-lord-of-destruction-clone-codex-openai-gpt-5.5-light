'use strict';
const {chromium}=require(process.env.CAPTURE_PLAYWRIGHT||'playwright');const {mkdir,readFile,writeFile}=require('node:fs/promises');const {createHash}=require('node:crypto');const path=require('node:path');
(async()=>{const output=process.env.CAPTURE_OUTPUT||'/tmp/ashen-reach-captures',site=process.env.CAPTURE_SITE||'capture-site';await mkdir(output,{recursive:true});const inputs={};for(const f of ['index.html','game.css','game.js'])inputs[f]=createHash('sha256').update(await readFile(path.join(site,f))).digest('hex');const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:1000},deviceScaleFactor:1,locale:'en-US',reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4213/',{waitUntil:'domcontentloaded'});await page.getByTestId('travel').click();await page.waitForTimeout(600);await page.getByTestId('skill-ember-bolt').click();await page.waitForTimeout(500);
 await page.screenshot({path:path.join(output,'ashen-reach-01.png'),animations:'disabled'});
 await page.getByTestId('dungeon').click();await page.waitForTimeout(800);await page.getByTestId('skill-cleave').click();await page.waitForTimeout(300);
 await page.screenshot({path:path.join(output,'ashen-reach-02.png'),animations:'disabled'});
 await writeFile(path.join(output,'capture.json'),JSON.stringify({schemaVersion:1,workflowCommit:process.env.GITHUB_SHA||null,sourceCommit:process.env.GAME_SOURCE_COMMIT||null,runId:process.env.GITHUB_RUN_ID||null,url:'http://127.0.0.1:4213/',inputs,browser:browser.version(),viewport:{width:1280,height:1000},screenshots:['ashen-reach-01.png','ashen-reach-02.png']},null,2)+'\n');
 }finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
