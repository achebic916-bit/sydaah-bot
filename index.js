const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys")
const pino = require("pino")
async function startBot(){
console.log("Starting Sydaah Bot...")
const { state, saveCreds } = await useMultiFileAuthState('./session')
const sock = makeWASocket({logger: pino({ level: "silent" }),auth: state,printQRInTerminal: false,browser: ["Sydaah","Chrome","121.0"]})
if(!sock.authState.creds.registered){
await delay(4000)
let phone=(process.env.PHONE_NUMBER||"254704048845").replace(/[^0-9]/g,'')
console.log("Requesting code for:",phone)
try{
let code=await sock.requestPairingCode(phone)
console.log(`\nPAIRING CODE: ${code}\n`)
}catch(e){
console.log("Retry...",e.message)
await delay(5000)
let code2=await sock.requestPairingCode(phone)
console.log(`\nPAIRING CODE RETRY: ${code2}\n`)
}}
sock.ev.on("creds.update",saveCreds)
sock.ev.on("connection.update",async(s)=>{
if(s.connection==="open"){console.log("✅ CONNECTED! BOT IMEWAKA!")}
if(s.connection==="close"){console.log("Closed, restarting...");await delay(5000);startBot()}
})
sock.ev.on("messages.upsert",async({messages})=>{
const m=messages[0];if(!m.message)return
let t=m.message.conversation||m.message.extendedTextMessage?.text||""
if(t.toLowerCase()==="ping"){await sock.sendMessage(m.key.remoteJid,{text:"Pong! Sydaah Bot Live 🔥"})}
})
}
startBot()
