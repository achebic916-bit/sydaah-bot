const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys")
const pino = require("pino")
async function startBot(){
console.log("Starting Sydaah Bot...")
const { state, saveCreds } = await useMultiFileAuthState('./session')
const sock = makeWASocket({logger: pino({level:"silent"}),auth: state,printQRInTerminal:false,browser:["Sydaah","Chrome","121.0"]})
if(!sock.authState.creds.registered){
await delay(5000)
let phone=(process.env.PHONE_NUMBER||"254704048845").replace(/[^0-9]/g,'')
console.log("Requesting code for:",phone)
try{
let code=await sock.requestPairingCode(phone)
console.log(`\n====================\nPAIRING CODE: ${code}\n====================\n`)
}catch(e){
console.log("Error, retrying...",e.message)
await delay(5000)
try{
let c2=await sock.requestPairingCode(phone)
console.log(`\nPAIRING CODE RETRY: ${c2}\n`)
}catch(e2){console.log(e2.message)}
}}
sock.ev.on("creds.update",saveCreds)
sock.ev.on("connection.update",async(s)=>{
if(s.connection==="open"){console.log("✅ BOT CONNECTED!")}
if(s.connection==="close"){console.log("Closed, restarting...");await delay(5000);startBot()}
})
}
startBot()
