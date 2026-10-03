require('http').createServer((_,res)=>res.end('Sydaah Bot Live')).listen(process.env.PORT||3000,()=>console.log('PORT OK'))
const fs=require('fs')
if(fs.existsSync('./session')) fs.rmSync('./session',{recursive:true,force:true})
console.log('Old session deleted - fresh start')
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys")
const pino = require("pino")
async function startBot(){
const { state, saveCreds } = await useMultiFileAuthState('./session')
const sock = makeWASocket({logger:pino({level:"silent"}),auth:state,browser:["Sydaah","Chrome","121.0"]})
if(!sock.authState.creds.registered){
await delay(3000)
let phone=(process.env.PHONE_NUMBER||"254704048845").replace(/[^0-9]/g,'')
console.log("Number:",phone)
try{
let code=await sock.requestPairingCode(phone)
console.log(`\n===== NEW CODE: ${code} =====\nWeka haraka ndani ya 25 sec!\n`)}catch(e){console.log(e.message)}}
sock.ev.on("creds.update",saveCreds)
sock.ev.on("connection.update",async(s)=>{
if(s.connection==="open"){console.log("✅ CONNECTED! Bot iko Live!")}
if(s.connection==="close"){console.log("Close, restart...");await delay(3000);startBot()}
})
}
startBot()
