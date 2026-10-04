/* Exercise the exact serializers bundled with this release; WebRTC itself is not mocked as proven working. */
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
function serializers(){
 let source=fs.readFileSync(require.resolve('../public/vendor/peerjs.min.js'),'utf8');
 const start=source.lastIndexOf('class ',source.indexOf('_chunkedData={}')),binary=source.slice(start).match(/^class (\w+)/)[1];
 source=source.replace('window.peerjs={Peer:eZ,util:ex}',`window.__serializers={Json:eQ,Binary:${binary},Chunker:n,clone:value=>JSON.parse(value)},window.peerjs={Peer:eZ,util:ex}`);
 const c={console,setTimeout,clearTimeout,setInterval,clearInterval,TextEncoder,TextDecoder,Uint8Array,ArrayBuffer,DataView,Blob,navigator:{userAgent:'test',platform:'test'},location:{protocol:'https:'}};c.window=c;vm.createContext(c);vm.runInContext(source,c);return c.__serializers;
}
const codecs=serializers();
function wire(receive){
 const bytes=[],sender=Object.create(codecs.Binary.prototype),receiver=Object.create(codecs.Binary.prototype);
 sender.chunker=new codecs.Chunker();sender._chunkedData={};sender._bufferedSend=data=>bytes.push(data);sender.send=(data,chunked)=>sender._send(data,chunked);sender.emitError=(type,message)=>{throw Error(type+': '+message);};
 receiver._chunkedData={};receiver.emit=(name,data)=>{if(name==='data')receive(data);};
 return {send(data){sender._send(codecs.clone(JSON.stringify(data)));},flush(reverse=false){const copy=bytes.splice(0);if(reverse)copy.reverse();for(const data of copy)receiver._handleDataMessage({data});return copy;},get pending(){return bytes;}};
}
module.exports={wire,codecs};
if(require.main===module){
 const c={};c.window=c;vm.createContext(c);vm.runInContext(fs.readFileSync(require.resolve('../public/student-rosters.js'),'utf8'),c);
 const students=c.LeagueStudents.defaults(),payload={type:'STATE_SYNC',protocol:7,build:'9.0.1',sessionId:'lesson',syncToken:'sync',rosterSnapshot:students,rosterCatalog:{schema:1,version:1,revision:'a'.repeat(64),students},scores:{gryffindor:100,slytherin:20,hufflepuff:30,ravenclaw:0}};
 const size=Buffer.byteLength(JSON.stringify(payload));assert(size>16300);
 const old=Object.create(codecs.Json.prototype);Object.assign(old,{encoder:new TextEncoder(),stringify:JSON.stringify,_bufferedSend(){throw Error('Old JSON unexpectedly sent large message');},emitError(type){this.failure=type;}});old._send(payload);assert.equal(old.failure,'message-too-big');
 let received;const channel=wire(data=>received=data);channel.send(payload);const chunks=channel.flush(true);assert(chunks.length>1);assert.equal(JSON.stringify(received),JSON.stringify(payload));
 const giant={type:'SYNC_MATCH_SUMMARY',payload:{students:Array.from({length:500},(_,i)=>({...students[i%students.length],id:'student-'+i,name:'Şüheda Sümeyye Hüseyin Öykü '.repeat(2),awards:30,points:1000000})),history:'Öğrenci ⭐'.repeat(20000)}};channel.send(giant);assert(channel.flush().length>10);assert.equal(JSON.stringify(received),JSON.stringify(giant));
 for(const message of [{type:'ACTION',action:'ADD',team:'gryffindor',id:'request-1'},{type:'STATE_SYNC_ACK',build:'9.0.1',sessionId:'lesson',syncToken:'sync'}]){channel.send(message);assert.equal(channel.flush().length,1);assert.equal(JSON.stringify(received),JSON.stringify(message));}
 assert.deepEqual(Object.keys(channel.pending),[]);
 console.log(`PASS shipped PeerJS JSON reproduces failure at ${size} bytes; binary serializer reconstructs full-roster sync and large summaries, including Turkish text, across multiple packets; small actions/receipts remain intact.`);
}
