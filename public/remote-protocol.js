/* Ordered command delivery with board receipts and session-bound deduplication. */
(function(root){
    'use strict';
    const KEY='englishLeague.remote.v7';
    function controller({send,status}){
        let saved;try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch{}
        let clientId=saved?.clientId||LeagueRecovery.uid(),sequence=Number(saved?.sequence)||0,sessionId=null,connected=false,timer=null;
        let queue=Array.isArray(saved?.queue)?saved.queue.slice(0,60):[];
        const persist=()=>{try{sessionStorage.setItem(KEY,JSON.stringify({clientId,sequence,queue}));}catch{}};
        function pump(){
            clearTimeout(timer);if(!connected||!sessionId||!queue.length)return;
            const entry=queue[0];if(entry.sessionId!==sessionId){queue.shift();persist();status('Previous-session command discarded','warning');pump();return;}
            send(entry);status('Confirming…','pending');timer=setTimeout(pump,1800);
        }
        return {
            sync(id){if(typeof id!=='string')return;const changed=!connected||sessionId!==id;sessionId=id;connected=true;if(changed)pump();},
            disconnect(){connected=false;clearTimeout(timer);if(queue.length)status('Waiting to reconnect…','pending');},
            enqueue(action,team,extra={}){
                if(!connected||!sessionId||queue.length>=60){status('Wait for the board connection','warning');return false;}
                const seq=++sequence;queue.push({type:'ACTION',protocol:7,sessionId,clientId,sequence:seq,commandId:`${clientId}:${seq}`,action,team,...extra});persist();pump();return true;
            },
            acknowledge(data){const first=queue[0];if(!first||data.commandId!==first.commandId)return false;queue.shift();clearTimeout(timer);persist();status(data.ok?(data.message||'✓ Confirmed'):data.message||'Action unavailable',data.ok?'ok':'warning');pump();return true;},
            get pending(){return queue.length;},get sessionId(){return sessionId;}
        };
    }
    function receive(data,{sessionId,ledger,apply,commit}){
        const reject=message=>({type:'ACTION_ACK',commandId:data.commandId,sessionId,ok:false,message});
        if(data.protocol!==7||typeof data.clientId!=='string'||data.clientId.length>100||!Number.isSafeInteger(data.sequence)||data.sequence<1||data.commandId!==`${data.clientId}:${data.sequence}`)return reject('Refresh the remote controller for v8.5.1');
        if(data.sessionId!==sessionId)return reject('The board has started a new session');
        const old=ledger[data.clientId];
        if(old&&data.sequence<=old.sequence)return {...(old.sequence===data.sequence?old.ack:{type:'ACTION_ACK',ok:true}),commandId:data.commandId,sessionId,duplicate:true};
        if(!old&&Object.keys(ledger).length>=32)return reject('Too many controllers for this session');
        const result=apply(data)||{ok:true};
        const ack={type:'ACTION_ACK',commandId:data.commandId,sessionId,ok:result.ok!==false,message:result.message||''};
        ledger[data.clientId]={sequence:data.sequence,ack};commit();return ack;
    }
    root.LeagueRemote={controller,receive};
})(window);
