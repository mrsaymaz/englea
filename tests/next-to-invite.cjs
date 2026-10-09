const assert=require('assert/strict'),fs=require('fs');
const {setup}=require('./support.cjs');
(async()=>{
 const e=await setup();
 try {
  fs.mkdirSync('output',{recursive:true});
  const board=await e.page();await board.evaluate(()=>{__qa.start();__qa.mode('light');});
  const context=await e.browser.newContext({viewport:{width:393,height:660},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const phone=await e.page(context);
  await phone.exposeFunction('__send',data=>board.evaluate(data=>window.__receive(data),data));
  await board.exposeFunction('__send',data=>phone.evaluate(data=>window.__receive(data),data));
  await phone.evaluate(()=>{document.getElementById('startup-overlay').classList.add('hidden');document.querySelector('.app-shell').style.display='none';document.getElementById('mobile-controller').classList.remove('hidden');__qa.connect('controller');});
  await board.evaluate(()=>__qa.connect('host'));await phone.waitForFunction(()=>Boolean(__qa.remoteSession()));
  assert.equal(await phone.locator('.mobile-invite-empty').count(),4);
  async function layoutFits(){
   return phone.evaluate(()=>{
    const failures=[];
    for(const node of document.querySelectorAll('.mobile-team-card,.mobile-invite-row,.mobile-score-button,.mobile-controller-footer')){
     const box=node.getBoundingClientRect();
     if(box.left<0||box.right>innerWidth+.5||box.top<0||box.bottom>innerHeight+.5)failures.push(node.className+': outside viewport');
     if(node.matches('.mobile-score-button')&&box.height<44)failures.push('small score target');
     if(node.matches('.mobile-team-card')&&node.scrollHeight>node.clientHeight+1)failures.push('card overflow');
    }
    const main=document.querySelector('.mobile-controller-main');
    if(main.scrollHeight>main.clientHeight+1)failures.push('portrait scroll');
    for(const name of document.querySelectorAll('.mobile-invite-name'))if(name.scrollWidth>name.clientWidth+1)failures.push('clipped name');
    return failures;
   });
  }
  for(const c of ['5-A','5-C','6-C','7-A','8-B']){
   await board.evaluate(c=>__qa.selectClass(c),c);
   await phone.waitForFunction(c=>__qa.state().remoteStudentClass===c,c);
   assert.equal(await phone.locator('.mobile-invite-row').count(),12);
   assert.deepEqual(await layoutFits(),[],c+' must fit at 393 × 660');
  }
  // Exercise every roster name, including the longest names, at mobile width.
  await phone.evaluate(()=>{
   for(const c of LeagueStudents.classes)for(const t of LeagueStudents.teams)for(const person of LeagueStudents.members(c,t)){
    const node=document.createElement('span');node.className='mobile-invite-name';node.textContent=person.name;
    document.querySelector('.mobile-invite-row').replaceChild(node,document.querySelector('.mobile-invite-name'));
    if(node.scrollWidth>node.clientWidth+1||node.getBoundingClientRect().height>21)throw Error('Name does not fit: '+person.name);
   }
  });
  await board.evaluate(()=>__qa.selectClass('5-A'));await phone.waitForFunction(()=>__qa.state().remoteStudentClass==='5-A');
  const firstNames=()=>phone.locator('#mobile-invite-gryffindor .mobile-invite-name').allTextContents();
  assert.deepEqual(await firstNames(),['Emobi Nese','Süvog','Meyebur Eril']);
  // v8.9+ opens Load islands when a class is chosen; the teacher continues offline here.
  await phone.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
  await phone.locator('.mobile-score-button.add[onclick*="gryffindor"]').click();
  await phone.locator('[data-student-id="5-A:gryffindor:0"].student-name-choice').click();
  await phone.waitForFunction(()=>__qa.state().remoteStudentContributions['5-A:gryffindor:0']?.awards===1);
  assert.deepEqual(await firstNames(),['Süvog','Meyebur Eril','Yurag Miyomo']);
  await board.evaluate(()=>__qa.resetTeam('gryffindor'));
  await phone.waitForFunction(()=>document.getElementById('mobile-score-gryffindor').textContent==='0');
  assert.deepEqual(await firstNames(),['Süvog','Meyebur Eril','Yurag Miyomo']);
  await board.locator('#undo-btn').click();await board.locator('#undo-btn').click();
  await phone.waitForFunction(()=>!__qa.state().remoteStudentContributions['5-A:gryffindor:0']);
  assert.deepEqual(await firstNames(),['Emobi Nese','Süvog','Meyebur Eril']);
  // Counts, rather than points, determine who is invited next.
  const ranking=await phone.evaluate(()=>LeagueStudents.nextToInvite('5-A','gryffindor',{
   '5-A:gryffindor:0':{points:100000,awards:1},'5-A:gryffindor:1':{points:2,awards:2},
   '5-A:gryffindor:2':{points:3,awards:3},'5-A:gryffindor:3':{points:3,awards:3},
   '5-A:gryffindor:4':{points:3,awards:3},'5-A:gryffindor:5':{points:3,awards:3},'5-A:gryffindor:6':{points:3,awards:3}
  }).map(p=>[p.name,p.awards]));
  assert.deepEqual(ranking,[['Emobi Nese',1],['Süvog',2],['Meyebur Eril',3]]);
  await phone.screenshot({path:'output/remote-iphone14pro-393x660.png'});
  await phone.setViewportSize({width:393,height:852});
  await phone.addStyleTag({content:'#mobile-controller{padding-top:59px}.mobile-controller-footer{padding-bottom:40px}'});
  assert.deepEqual(await layoutFits(),[],'full screen with reserved safe areas');
  await phone.screenshot({path:'output/remote-iphone14pro-safe-area.png'});
  await phone.setViewportSize({width:852,height:393});
  await phone.locator('.mobile-score-button').last().scrollIntoViewIfNeeded();
  assert.equal(await phone.locator('.mobile-score-button').last().isVisible(),true);
  await board.evaluate(()=>__qa.reset());await phone.waitForFunction(()=>!__qa.state().remoteStudentClass);
  assert.equal(await phone.locator('.mobile-invite-row').count(),0);
  assert.equal(await phone.locator('.mobile-invite-empty').count(),4);
  assert.deepEqual(e.errors,[]);
  console.log('PASS iPhone 14 Pro 393x660 portrait fit; 393x852 safe-area fit; all roster names fit; 44px score targets; landscape controls reachable');
  console.log('PASS four live lists, zero counts, ascending participation, stable ties, award sync, reset preservation, undo, class changes and new-session clearing');
 } finally {await e.close();}
})().catch(err=>{console.error(err);process.exit(1);});
