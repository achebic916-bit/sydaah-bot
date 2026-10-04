require('http').createServer((_,res)=>res.end('Sydaah Bot Live')).listen(process.env.PORT||3000,()=>console.log('PORT OK'))
const fs=require('fs')
const { default: makeWASocket, useMultiFileAuthState, delay } = require("@whiskeysockets/baileys")
const pino=require("pino")

async function createSessionFromEnv(){
  const sessionId = process.env.SESSION_ID
  if(!sessionId || fs.existsSync('./session/creds.json')) return
  try{
    let id = sessionId.includes('~')? sessionId.split('~')[1] : sessionId
    let buff = Buffer.from(id, 'base64').toString('utf-8')
    let data = JSON.parse(buff)
    if(!fs.existsSync('./session')) fs.mkdirSync('./session',{recursive:true})
    let credsData = data.creds || data
    fs.writeFileSync('./session/creds.json', JSON.stringify(credsData, null, 2))
    console.log('✅ SESSION_ID loaded')
  }catch(e){
    console.log('Decode error:', e.message)
  }
}

async function startBot(){
  await createSessionFromEnv()
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const sock = makeWASocket({logger:pino({level:"silent"}),auth:state,browser:["Sydaah","Chrome","121.0"]})
  sock.ev.on("creds.update", saveCreds)
  sock.ev.on("connection.update", async(s)=>{
    const { connection } = s
    if(connection==="open") console.log("✅ SYDAAH CONNECTED! Bot iko Live!")
    if(connection==="close") { console.log("Restart..."); await delay(3000); startBot() }
  })

  sock.ev.on("messages.upsert", async(m)=>{
    const msg = m.messages[0]
    if(!msg.message) return
    const from = msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    if(text.toLowerCase()==="ping") await sock.sendMessage(from, {text:"Pong! Sydaah Bot Live ✅"})
  })
}

startBot()
