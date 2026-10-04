const http = require('http')
http.createServer((_,res)=>res.end('Sydaah Bot Online 🔥')).listen(process.env.PORT||3000,()=>console.log('PORT OK'))

const fs = require('fs')
const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason } = require("@whiskeysockets/baileys")
const pino = require("pino")

async function loadSession(){
  const sessionId = process.env.SESSION_ID
  if(!sessionId) { console.log('No SESSION_ID'); return }
  try{
    if(!fs.existsSync('./session')) fs.mkdirSync('./session',{recursive:true})
    let raw = sessionId.trim()
    if(raw.includes('~')) raw = raw.split('~')[1]
    raw = raw.replace(/\s/g,'').replace(/[^A-Za-z0-9+/=]/g,'')

    let buffer = Buffer.from(raw, 'base64')

    // Check if ZIP
    if(buffer[0]==0x50 && buffer[1]==0x4B){
      console.log('ZIP session detected...')
      fs.writeFileSync('./session.zip', buffer)
      const AdmZip = require('adm-zip')
      const zip = new AdmZip('./session.zip')
      zip.extractAllTo('./session', true)
      fs.unlinkSync('./session.zip')
      console.log('✅ ZIP extracted!')
    }else{
      let data = JSON.parse(buffer.toString())
      fs.writeFileSync('./session/creds.json', JSON.stringify(data.creds||data, null, 2))
      console.log('✅ JSON session loaded!')
    }
  }catch(e){ console.log('Session Error:', e.message) }
}

async function startBot(){
  await loadSession()
  const { state, saveCreds } = await useMultiFileAuthState('./session')
  const sock = makeWASocket({ logger:pino({level:"silent"}), auth:state, browser:["Sydaah","Chrome","121"] })
  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("connection.update", async(u)=>{
    if(u.connection==="open") console.log("✅ SYDAAH BOT CONNECTED! Mambo iko sawa!")
    if(u.connection==="close"){
      let reason = u.lastDisconnect?.error?.output?.statusCode
      console.log("Disconnected:", reason)
      if(reason!== DisconnectReason.loggedOut){ await delay(3000); startBot() }
    }
  })

  sock.ev.on("messages.upsert", async({messages})=>{
    const msg = messages[0]
    if(!msg.message || msg.key.fromMe) return
    const from = msg.key.remoteJid
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
    const cmd = text.toLowerCase().trim()

    if(cmd==="ping") await sock.sendMessage(from, {text:"Pong! Sydaah Bot Live ✅🔥"})
    if(cmd==="menu" || cmd===".menu"){
      await sock.sendMessage(from, {text:`*SYDAAH BOT MENU* 🔥

.ping - Angalia kama bot iko live
.menu - Hii menu
.owner - Mmwenye bot
.alive - Bot status
`})
    }
    if(cmd==="alive" || cmd==="owner"){
      await sock.sendMessage(from, {text:"Sydaah Bot by Phidel ✅ Iko online 24/7"})
    }
  })
}
startBot()
