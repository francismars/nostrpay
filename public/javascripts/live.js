const kind1ID = "fe0ec3975412ad3cfe0c9370600e3ea5ab9fa6c414604ef4a2fd4ee66be0edf8"

const pool = new NostrTools.SimplePool()
const relays = ['wss://relay.damus.io', 'wss://relay.primal.net', 'wss://relay.nostr.band/', 'wss://relay.nostr.nu/']

subscribeKind1()

async function subscribeKind1() {
    let filter = { kinds: [1], ids: [kind1ID]}
    pool.subscribeMany(
        [...relays],
        [filter],
        {
        async onevent(kind1) {
            drawKind1(kind1)
            await subscribeKind0fromKind1(kind1)
            await subscribeKind9735fromKind1(kind1)
        },
        oneose() {
            console.log("subscribeKind1() EOS")
        },
        onclosed() {
            console.log("subscribeKind1() Closed")
        }
    })
  }

  async function subscribeKind0fromKind1(kind1) {
    let kind0key = kind1.pubkey
    const sub = pool.subscribeMany(
        [...relays],
        [{
            kinds: [0],
            authors: [kind0key]
        }]
    ,{
        onevent(kind0) {
            drawKind0(kind0)
        },
        oneose() {
            console.log("subscribeKind0sfromKind1s() EOS")
        },
        onclosed() {
            console.log("subscribeKind0sfromKind1s() Closed")
        }
    })
  }

  async function subscribeKind9735fromKind1(kind1) {
    let kinds9735IDs = new Set();
    let kinds9735 = []
    const kind1id = kind1.id
    let isFirstStream = true

    const zapsContainer = document.getElementById("zaps");

    const sub = pool.subscribeMany(
        [...relays],
        [{
            kinds: [9735],
            "#e": [kind1id]
        }]
    ,{
        onevent(kind9735) {
            if(!(kinds9735IDs.has(kind9735.id))){
                kinds9735IDs.add(kind9735.id)
                kinds9735.push(kind9735)
                if(!isFirstStream){

                }
            }
        },
        oneose() {
            isFirstStream = false
            subscribeKind0fromKinds9735(kinds9735)
            console.log("subscribeKind9735fromKind1() EOS")
        },
        onclosed() {
            console.log("subscribeKind9735fromKind1() Closed")
        }
    })
  }

function subscribeKind0fromKinds9735(kinds9735){
    let kind9734PKs = []
    let kind0fromkind9735List = []
    let kind0fromkind9735Seen = new Set();
    for(let kind9735 of kinds9735){
        if(kind9735.tags){
            const description9735 = kind9735.tags.find(tag => tag[0] === "description")[1];
            const kind9734 = JSON.parse(description9735)
            kind9734PKs.push(kind9734.pubkey)
        }
    }
    let h = pool.subscribeMany(
        [...relays],
        [{
            kinds: [0],
            authors: kind9734PKs
        }]
    ,{
    onevent(kind0) {
        if(!(kind0fromkind9735Seen.has(kind0.pubkey))){
            kind0fromkind9735Seen.add(kind0.pubkey);
            kind0fromkind9735List.push(kind0)
        }
    },
    async oneose() {
        createkinds9735JSON(kinds9735, kind0fromkind9735List)
        console.log("subscribeKind0fromKinds9735() EOS")
    },
    onclosed() {
        console.log("subscribeKind0fromKinds9735() Closed")
    }
  })
}

async function createkinds9735JSON(kind9735List, kind0fromkind9735List){
    let json9735List = []
    for(let kind9735 of kind9735List){
        const description9735 = JSON.parse(kind9735.tags.find(tag => tag[0] == "description")[1])
        const pubkey9735 = description9735.pubkey
        const bolt119735 = kind9735.tags.find(tag => tag[0] == "bolt11")[1]
        const amount9735 = lightningPayReq.decode(bolt119735).satoshis
        const kind1from9735 = kind9735.tags.find(tag => tag[0] == "e")[1]
        const kind9735id = NostrTools.nip19.noteEncode(kind9735.id)
        const kind9735Content = kind9735.content
        let kind0picture = ""
        let kind0npub = ""
        let kind0name = ""
        const kind0fromkind9735 = kind0fromkind9735List.find(kind0 => pubkey9735 === kind0.pubkey);
        if(kind0fromkind9735){
            kind0name = JSON.parse(kind0fromkind9735.content).name
            kind0picture = JSON.parse(kind0fromkind9735.content).picture
            kind0npub = NostrTools.nip19.npubEncode(kind0fromkind9735.pubkey)
        }
        const json9735 = {"e": kind1from9735, "amount": amount9735, "picture": kind0picture, "npubPayer": kind0npub, "pubKey": pubkey9735, "zapEventID": kind9735id, "kind9735content": kind9735Content, "kind1Name": kind0name}
        json9735List.push(json9735)
    }
    drawKinds9735(json9735List)
  }



  function drawKind1(kind1){
    console.log(kind1)
      document.getElementById("noteContent").innerText = kind1.content;
      let qrcodeContainer = document.getElementById("qrCode");
      qrcodeContainer.innerHTML = "";
      new QRious({
        element: qrcodeContainer,
        size: 800,
        value: "https://njump.me/"+NostrTools.nip19.noteEncode(kind1.id)
      });
      document.getElementById("qrcodeLinkNostr").href = "https://njump.me/"+NostrTools.nip19.noteEncode(kind1.id)
  }

  function drawKind0(kind0){
      let authorContent = JSON.parse(kind0.content)
      document.getElementById("authorName").innerText = authorContent.name;
      document.getElementById("authorNameProfileImg").src = authorContent.picture;
  }


function drawKinds9735(json9735List){
    console.log(json9735List)
    
    const zapsContainer = document.getElementById("zaps");

    for(let json9735 of json9735List){
      const zapDiv = document.createElement("div");
      zapDiv.className = "zap";

      if(!json9735.picture) json9735.picture = ""
      const profileImage = json9735.picture == "" ? "/images/gradient_color.gif" : json9735.picture

      zapDiv.innerHTML = `
          <div id="zapper">
              <div class="zapperProfile">
                <img class="userImg zapperProfileImg" src="${profileImage}" />
                <div>
                  <div id="zapperName">
                      ${json9735.kind1Name}
                  </div>
                  <div id="zapperAmount">
                      <span id="zapperAmountValue">${json9735.amount}</span> <span>sats</span>
                  </div>
                </div>
              </div>
              <div id="zapperContent">
                  ${json9735.kind9735content}
              </div>

          </div>
      `;
      zapsContainer.appendChild(zapDiv);
      /*
      if(!json9735.picture) json9735.picture = ""
      const profileImage = json9735.picture == "" ? "https://icon-library.com/images/generic-user-icon/generic-user-icon-10.jpg" : json9735.picture
      let zapPayerLink = '<a href="https://nostrudel.ninja/#/u/'+json9735.npubPayer+'" target="_blank"><img class="userImg" src="'+profileImage+'" /></a>'
      let zapEventLink = '<a href="https://nostrudel.ninja/#/n/'+json9735.zapEventID+'" target="_blank" class="zapReactionAmount">'+json9735.amount+'</a>'
      */
    }
}