require('http').createServer((_,res)=>res.end('Sydaah Bot Live')).listen(process.env.PORT||3000,()=>console.log('PORT OK'))
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys")
const pino = require("pino")
async function startBot(){
console.log("Starting Sydaah Bot...")
const { state, saveCreds } = await useMultiFileAuthState('./session')
const sock = makeWASocket({logger:pino({level:"silent"}),auth:state,printQRInTerminal:false,browser:["Sydaah","Chrome","121.0"]})
if(!sock.authState.creds.registered){
await delay(4000)
let phone=(process.env.PHONE_NUMBER||"254704048845").replace(/[^0-9]/g,'')
console.log("Requesting code for:",phone)
let code=await sock.requestPairingCode(phone)
console.log(`\n==== PAIRING CODE: ${code} ====\n`)}
sock.ev.on("creds.update",saveCreds)
sock.ev.on("connection.update",async(s)=>{
if(s.connection==="open")console.log("✅ BOT CONNECTED!")
if(s.connection==="close" && s.lastDisconnect?.error?.output?.statusCode!==401){console.log("Restarting...");await delay(5000);startBot()}
})
}
startBot()
