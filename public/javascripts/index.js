const drawKind1 = await import("./drawkind1.js");
const drawKind9735 = await import("./drawkind9735.js");
const signIn = await import("./signIn.js");
const util = await import("./util.js");
const zap = await import("./zap.js");

async function loadDummyKind1s(dummies = 5) {
  const response = await fetch("../html/dummyKind1.html");
  const html = await response.text();
  document.getElementById("main").innerHTML = html.repeat(dummies);
}

const pool = new NostrTools.SimplePool();
const relays = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://relay.nostr.band/",
  "wss://relay.nostr.nu/",
];

if (localStorage.getItem("publicKey") || sessionStorage.getItem("publicKey")) {
  subscribeKind0();
}

let kind1List = [];
let kind1Seen = new Set();
let Kind1ListFollowing = [];
let Kind1SeenFollowing = new Set();

const queryParams = new URLSearchParams(window.location.search);
const queryNote = queryParams.get("note");
queryNote ? loadDummyKind1s(1) : loadDummyKind1s();
if (queryNote) {
  const decoded = NostrTools.nip19.decode(queryNote);
  if (decoded.type !== "note") {
    console.error("Invalid type. Expected 'note', got:", decoded.type);
    pass;
  }
  if (!/^[0-9a-f]{64}$/.test(decoded.data)) {
    console.error("Invalid event ID format:", decoded.data);
    pass;
  }
  const feedSelector = document.getElementById("feedSelector");
  feedSelector.style.display = "none";
  subscribePubPay(decoded.data);
} else {
  subscribePubPays();
}

let isLoadingMore = false;
async function subscribePubPays(kind3PKs = null, isSubscribeMore = false) {
  const iskind3filter = kind3PKs != null ? true : false;
  const filter = { kinds: [1], "#t": ["pubpay"], limit: 21 };
  if (kind3PKs != null) filter.authors = kind3PKs;
  const newkind1List = [];
  const newkind1Seen = iskind3filter
    ? new Set([...Kind1SeenFollowing])
    : new Set([...kind1Seen]);
  if (isSubscribeMore) {
    if (kind1List.length < 21) return;
    isLoadingMore = true;
    const oldestEvent = iskind3filter
      ? Kind1ListFollowing[Kind1ListFollowing.length - 1]
      : kind1List[kind1List.length - 1];
    filter.until = oldestEvent.created_at;
    const subLoadMore = pool.subscribeMany([...relays], [filter], {
      async onevent(kind1) {
        if (kind1.tags && !newkind1Seen.has(kind1.id)) {
          newkind1Seen.add(kind1.id);
          newkind1List.push(kind1);
        }
      },
      async oneose() {
        console.log("LoadMore subscription EOS");
        newkind1List.sort((a, b) => b.created_at - a.created_at);
        await subscribeKind0sfromKind1s(
          newkind1List,
          "loadMore",
          iskind3filter
        );
        subLoadMore.close();
        if (iskind3filter) {
          Kind1ListFollowing.push(...newkind1List);
          Kind1SeenFollowing.clear();
          Kind1SeenFollowing = new Set([...newkind1Seen]);
        } else if (!iskind3filter) {
          kind1List.push(...newkind1List);
          kind1Seen.clear();
          kind1Seen = new Set([...newkind1Seen]);
        }
        isLoadingMore = false;
      },
      onclosed() {
        console.log("Load More subscription closed.");
      },
    });
    return;
  }
  let streamType = "firstStream";
  pool.subscribeMany([...relays], [filter], {
    async onevent(kind1) {
      if (kind1.tags && !newkind1Seen.has(kind1.id)) {
        newkind1Seen.add(kind1.id);
        if (streamType == "newKind1") {
          await subscribeKind0sfromKind1s([kind1], streamType, iskind3filter);
        } else {
          newkind1List.push(kind1);
        }
      }
    },
    async oneose() {
      if (streamType == "firstStream") {
        newkind1List.sort((a, b) => b.created_at - a.created_at);
        await subscribeKind0sfromKind1s(
          newkind1List,
          streamType,
          iskind3filter
        );
        if (iskind3filter) {
          Kind1ListFollowing.push(...newkind1List);
          Kind1SeenFollowing.clear();
          Kind1SeenFollowing = new Set([...newkind1Seen]);
        } else if (!iskind3filter) {
          kind1List.push(...newkind1List);
          kind1Seen.clear();
          kind1Seen = new Set([...newkind1Seen]);
        }
        streamType = "newKind1";
        console.log("subscribePubPays() EOS");
      }
    },
    async onclosed() {
      console.log("subscribePubPays() Closed");
    },
  });
  return;
}

async function subscribePubPay(eventID) {
  const filter = { kinds: [1], ids: [eventID] };
  const newkind1List = [];

  const subKind1 = pool.subscribeMany([...relays], [filter], {
    async onevent(kind1) {
      newkind1List.push(kind1);
    },
    async oneose() {
      await subscribeKind0sfromKind1s(newkind1List, "singlePubPay", false);
      await subscribeReplies(eventID);
      console.log("subscribePubPay() EOS");
      subKind1.close();
    },
    async onclosed() {
      console.log("subscribePubPay() Closed");
    },
  });
  return;
}

async function subscribeReplies(parentEventID) {
  const replyFilter = { kinds: [1], "#e": [parentEventID] };
  const replyList = [];
  const replySeen = new Set();
  const subReplies = pool.subscribeMany([...relays], [replyFilter], {
    async onevent(reply) {
      if (!replySeen.has(reply.id)) {
        replySeen.add(reply.id);
        replyList.push(reply);
      }
    },
    async oneose() {
      console.log("subscribeReplies() EOS");
      await subscribeKind0sfromKind1s(replyList, "replies", false);
      subReplies.close();
    },
    async onclosed() {
      console.log("subscribeReplies() Closed");
    },
  });
}

async function subscribeKind0sfromKind1s(
  kind1List,
  streamType = "newKind1",
  iskind3filter = false
) {
  const kind0List = [];
  const kind1PubkeyList = [];
  for (let kind1 of kind1List) {
    kind1PubkeyList.push(kind1.pubkey);
  }
  const sub = pool.subscribeMany(
    [...relays],
    [
      {
        kinds: [0],
        authors: kind1PubkeyList,
      },
    ],
    {
      onevent(kind0) {
        kind0List.push(kind0);
      },
      async oneose() {
        console.log("subscribeKind0sfromKind1s() EOS");
        await drawKind1s(kind1List, kind0List, streamType, iskind3filter);
        await subscribeKind9735(kind1List, iskind3filter);
        sub.close();
      },
      onclosed() {
        console.log("subscribeKind0sfromKind1s() Closed");
      },
    }
  );
}

async function drawKind1s(kind1List, kind0List, streamType, iskind3filter) {
  const divID = iskind3filter ? "following" : "main";
  if (streamType == "firstStream" || streamType == "singlePubPay")
    document.getElementById(divID).innerHTML = "";
  if (streamType == "replies") {
    kind1List.sort((a, b) => a.created_at - b.created_at);
    /*
    const filteredEvents = [];
    const otherEvents = [];
    for (const event of kind1List) {
      const replyTag = event.tags.find((tag) => tag[3] === "reply");
      const rootTag = event.tags.find((tag) => tag[3] === "root");
      if (replyTag && rootTag && replyTag[1] != rootTag[1]) {
        filteredEvents.push(event);
      } else {
        otherEvents.push(event);
      }
    }
    filteredEvents.sort((a, b) => b.created_at - a.created_at);
    kind1List = [...otherEvents, ...filteredEvents];
    */
  }
  for (let kind1 of kind1List) {
    const kind0 = kind0List.find(({ pubkey }) => pubkey === kind1.pubkey);
    if (kind0) await drawKind1.plot(kind1, kind0, streamType, iskind3filter);
  }
}

async function subscribeKind9735(kind1List, iskind3filter) {
  let kind9735Seen = new Set();
  let kind1IDList = [];
  let kind9735List = [];
  let firstStream = true;
  for (let kind1 of kind1List) {
    kind1IDList.push(kind1.id);
  }
  const sub = pool.subscribeMany(
    [...relays],
    [
      {
        kinds: [9735],
        "#e": kind1IDList,
      },
    ],
    {
      async onevent(kind9735) {
        if (kind9735Seen.has(kind9735.id)) {
          return;
        } else {
          kind9735Seen.add(kind9735.id);
          kind9735List.push(kind9735);
        }
        if (!firstStream) {
          await subscribeKind0sfromKind9735s(
            [kind9735],
            kind1List,
            iskind3filter
          );
        }
      },
      async oneose() {
        console.log("subscribeKind9735() EOS");
        if (kind9735List.length > 0)
          await subscribeKind0sfromKind9735s(
            kind9735List.reverse(),
            kind1List,
            iskind3filter
          );
        firstStream = false;
        //sub.close()
      },
      onclosed() {
        //console.log("Closed")
      },
    }
  );
}

async function subscribeKind0sfromKind9735s(
  kind9735List,
  kind1List,
  iskind3filter
) {
  let pubkeys9734 = [];
  let kind0fromkind9735List = [];
  let kind0fromkind9735Seen = new Set();
  for (let kind9735 of kind9735List) {
    if (kind9735.tags) {
      const description9735 = kind9735.tags.find(
        (tag) => tag[0] === "description"
      )[1];
      const kind9734 = JSON.parse(description9735);
      pubkeys9734.push(kind9734.pubkey);
    }
  }
  let h = pool.subscribeMany(
    [...relays],
    [
      {
        kinds: [0],
        authors: pubkeys9734,
      },
    ],
    {
      onevent(kind0) {
        if (kind0fromkind9735Seen.has(kind0.pubkey)) {
          return;
        } else {
          kind0fromkind9735Seen.add(kind0.pubkey);
          kind0fromkind9735List.push(kind0);
        }
      },
      async oneose() {
        console.log("subscribeKind0sfromKind9735s() EOS");
        await createkinds9735JSON(
          kind9735List,
          kind0fromkind9735List,
          kind1List,
          iskind3filter
        );
        h.close();
      },
      onclosed() {
        console.log("subscribeKind0sfromKind9735s() Closed");
      },
    }
  );
}

async function createkinds9735JSON(
  kind9735List,
  kind0fromkind9735List,
  kind1List,
  iskind3filter
) {
  let json9735List = [];
  for (let kind9735 of kind9735List) {
    const description9735 = JSON.parse(
      kind9735.tags.find((tag) => tag[0] == "description")[1]
    );
    const pubkey9735 = description9735.pubkey;
    const id9734 = description9735.id;
    const bolt119735 = kind9735.tags.find((tag) => tag[0] == "bolt11")[1];
    const amount9735 = lightningPayReq.decode(bolt119735).satoshis;
    const kind1from9735 = kind9735.tags.find((tag) => tag[0] == "e")[1];
    const kind9735id = NostrTools.nip19.noteEncode(kind9735.id);
    let kind0picture;
    let kind0npub;
    let kind1tags;
    const kind1 = kind1List.find((kind1) => kind1.id === kind1from9735);
    if (kind1) {
      kind1tags = kind1.tags;
    }
    const kind0fromkind9735 = kind0fromkind9735List.find(
      (kind0) => pubkey9735 === kind0.pubkey
    );
    if (kind0fromkind9735) {
      kind0picture = JSON.parse(kind0fromkind9735.content).picture;
      kind0npub = NostrTools.nip19.npubEncode(kind0fromkind9735.pubkey);
    } else {
      kind0picture = "";
      kind0npub = "";
    }
    const json9735 = {
      e: kind1from9735,
      amount: amount9735,
      picture: kind0picture,
      npubPayer: kind0npub,
      pubKey: pubkey9735,
      zapEventID: kind9735id,
      tags: kind1tags,
      id9734: id9734,
    };
    json9735List.push(json9735);
  }
  await drawKind9735.plot(json9735List, iskind3filter);
}

(function () {
  document.getElementById("newPayNote").addEventListener("click", function () {
    if (!signIn.getPublicKey()) {
      const loginForm = document.getElementById("loginForm");
      if (loginForm.style.display == "none") {
        loginForm.style.display = "flex";
      }
      return;
    }
    const newNoteForm = document.getElementById("newPayNoteForm");
    if (
      newNoteForm.style.display === "none" ||
      newNoteForm.style.display === ""
    ) {
      newNoteForm.style.display = "flex";
    } else {
      newNoteForm.style.display = "none";
    }
  });

  document.getElementById("fixedFlow").addEventListener("click", function () {
    const fixedInterface = document.getElementById("fixedInterface");
    fixedInterface.style.display = "block";
    const rangeInterface = document.getElementById("rangeInterface");
    rangeInterface.style.display = "none";
    document.getElementById("zapMin").value = "";
    document.getElementById("zapMax").value = "";
    document.getElementById("zapMin").removeAttribute("required");
    document.getElementById("zapMax").removeAttribute("required");
    document.getElementById("zapFixed").setAttribute("required", "true");
  });

  document.getElementById("rangeFlow").addEventListener("click", function () {
    const rangeInterface = document.getElementById("rangeInterface");
    rangeInterface.style.display = "flex";
    const fixedInterface = document.getElementById("fixedInterface");
    fixedInterface.style.display = "none";
    document.getElementById("zapFixed").value = "";
    document.getElementById("zapMin").setAttribute("required", "true");
    document.getElementById("zapMax").setAttribute("required", "true");
    document.getElementById("zapFixed").removeAttribute("required");
  });

  document
    .getElementById("cancelNewNote")
    .addEventListener("click", function (event) {
      event.preventDefault();
      const newNoteForm = document.getElementById("newPayNoteForm");
      if (
        newNoteForm.style.display === "none" ||
        newNoteForm.style.display === ""
      ) {
        newNoteForm.style.display = "flex";
      } else {
        newNoteForm.style.display = "none";
      }
    });

  document.getElementById("closeJSON").addEventListener("click", function () {
    const viewJSONelement = document.getElementById("viewJSON");
    if (viewJSONelement.style.display == "flex") {
      viewJSONelement.style.display = "none";
    }
  });

  let subscribedKind3 = false;
  document
    .getElementById("feedFollowing")
    .addEventListener("click", async function () {
      if (!signIn.getPublicKey()) {
        const loginForm = document.getElementById("loginForm");
        if (loginForm.style.display == "none") {
          loginForm.style.display = "flex";
        }
        return;
      }
      document.getElementById("feedFollowing").classList.add("active");
      document.getElementById("feedGlobal").classList.remove("active");
      const mainDiv = document.getElementById("main");
      if (mainDiv.style.display == "block") {
        mainDiv.style.display = "none";
        if (!subscribedKind3) {
          await subscribeKind3();
          subscribedKind3 = true;
        }
      }
      const followingDiv = document.getElementById("following");
      if (followingDiv.style.display == "none") {
        followingDiv.style.display = "block";
      }
    });

  document.getElementById("feedGlobal").addEventListener("click", function () {
    document.getElementById("feedFollowing").classList.remove("active");
    document.getElementById("feedGlobal").classList.add("active");
    const mainDiv = document.getElementById("main");
    if (mainDiv.style.display == "none") {
      mainDiv.style.display = "block";
    }
    const followingDiv = document.getElementById("following");
    if (followingDiv.style.display == "block") {
      followingDiv.style.display = "none";
    }
  });

  document.getElementById("newKind1").addEventListener("submit", submitKind1);

  document
    .getElementById("login")
    .addEventListener("click", async (event) => await openLoginMenu(event));
})();

async function openLoginMenu(event) {
  event.preventDefault();
  const UserPK = signIn.getPublicKey();
  const loginForm = UserPK
    ? document.getElementById("loggedInForm")
    : document.getElementById("loginForm");
  if (UserPK) {
    document.getElementById("loggedInPublicKey").innerHTML =
      await drawKind1.formatContent(NostrTools.nip19.npubEncode(UserPK));
    document.getElementById("loggedInMethod").innerHTML =
      signIn.getSignInMethod();
  }
  if (loginForm.style.display == "none") {
    loginForm.style.display = "flex";
  }
}

document.getElementById("cancelLogin").addEventListener("click", (event) => {
  event.preventDefault();
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("nsecInputGroup").style.display = "none";
  document.getElementById("loginFormGroup").style.display = "flex";
});

document.getElementById("logoutButton").addEventListener("click", (event) => {
  event.preventDefault();
  signIn.cleanSignInData();
  kind3PKs = [];
  document.getElementById("following").innerHTML = "";
  document.getElementById("login").innerHTML =
    '<span class="material-symbols-outlined">account_circle</span>';
  document.getElementById("loggedInForm").style.display = "none";
});

document.getElementById("cancelLoggedin").addEventListener("click", (event) => {
  event.preventDefault();
  document.getElementById("loggedInForm").style.display = "none";
});

document.getElementById("signInNsec").addEventListener("click", async () => {
  document.getElementById("nsecInputGroup").style.display = "block";
  document.getElementById("loginFormGroup").style.display = "none";
});

document
  .getElementById("continueWithNsec")
  .addEventListener("click", async (event) => {
    event.preventDefault();
    const nsec = document.getElementById("nsecInput").value;
    const rememberMe = document.getElementById("rememberMe").checked;
    try {
      await signIn.signIn("nsec", rememberMe ? true : false, nsec);
    } catch (error) {
      console.error(error);
      return;
    }
    await subscribeKind0();
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("nsecInputGroup").style.display = "none";
    document.getElementById("loginFormGroup").style.display = "flex";
  });

document
  .getElementById("signInExtension")
  .addEventListener("click", async () => {
    const button = document.getElementById("signInExtension").className;
    const disabled = button.includes("disabled") ? true : false;
    if (disabled) {
      return;
    }
    const rememberMe = document.getElementById("rememberMe").checked;
    try {
      await signIn.signIn("extension", rememberMe ? true : false);
    } catch (error) {
      console.error(error.message);
      return;
    }
    await subscribeKind0();
    document.getElementById("loginForm").style.display = "none";
  });

document
  .getElementById("signInexternalSigner")
  .addEventListener("click", async () => {
    const button = document.getElementById("signInexternalSigner").className;
    const disabled = button.includes("disabled") ? true : false;
    if (disabled) {
      return;
    }
    const rememberMe = document.getElementById("rememberMe").checked;
    try {
      await signIn.signIn("externalSigner", rememberMe ? true : false);
    } catch (error) {
      console.error(error.message);
      return;
    }
    document.getElementById("loginForm").style.display = "none";
  });

export async function subscribeKind0() {
  const UserPK = signIn.getPublicKey();
  if (UserPK == null) {
    console.log("No UserPK found.");
    return;
  }
  let h = pool.subscribeMany(
    [...relays],
    [
      {
        kinds: [0],
        authors: [UserPK],
      },
    ],
    {
      onevent(kind0) {
        handleKind0data(kind0);
      },
      async oneose() {
        console.log("subscribeKind0() EOS");
        h.close();
      },
      onclosed() {
        console.log("subscribeKind0() Closed");
      },
    }
  );
}

function handleKind0data(kind0) {
  if (kind0.content) {
    const parsedContent = JSON.parse(kind0.content);
    if (parsedContent.picture) {
      document.getElementById("login").innerHTML =
        '<img class="userImg currentUserImg" src="' +
        parsedContent.picture +
        '">';
    }
  }
}

async function subscribeKind3() {
  const pubKey = signIn.getPublicKey();
  if (!pubKey) return console.log("No UserPK found.");
  let h = pool.subscribeMany(
    [...relays],
    [
      {
        kinds: [3],
        authors: [pubKey],
      },
    ],
    {
      onevent(kind3) {
        extractPKsfromKind3s(kind3);
      },
      async oneose() {
        console.log("subscribeKind3() EOS");
        h.close();
      },
      onclosed() {
        console.log("subscribeKind3() Closed");
      },
    }
  );
}

let kind3PKs = [];
function extractPKsfromKind3s(kind3) {
  if (kind3.tags) {
    for (let kind3tag of kind3.tags) {
      if (kind3tag[0] == "p") kind3PKs.push(kind3tag[1]);
    }
  }
  subscribePubPays(kind3PKs);
}

async function submitKind1(event) {
  event.preventDefault();
  const payNoteContent = document.getElementById("payNoteContent").value;
  if (payNoteContent == "") {
    /*Handle This*/
  }
  let tagsList = [];
  const isFixedFlow = document.getElementById("fixedFlow").checked;
  const isRangeFlow = document.getElementById("rangeFlow").checked;
  let zapMin, zapMax;
  if (!isFixedFlow && isRangeFlow) {
    let zapMinInput = document.getElementById("zapMin").value;
    if (!(Number.isInteger(parseInt(zapMinInput)) && zapMinInput > 0))
      return console.log("Insert ZAP-MIN.");
    else zapMin = zapMinInput;
    let zapMaxInput = document.getElementById("zapMax").value;
    if (!(Number.isInteger(parseInt(zapMaxInput)) && zapMaxInput > 0))
      return console.log("Insert ZAP-MAX.");
    else zapMax = zapMaxInput;
    if (zapMax < zapMin) return console.log("ZAP-MIN > ZAP-MAX.");
  } else if (isFixedFlow && !isRangeFlow) {
    let zapFixedInput = document.getElementById("zapFixed").value;
    if (!(Number.isInteger(parseInt(zapFixedInput)) && zapFixedInput > 0))
      return console.log("Insert ZAP AMOUNT.");
    else (zapMin = zapFixedInput), (zapMax = zapFixedInput);
  }
  tagsList.push(["zap-min", (zapMin * 1000).toString()]);
  tagsList.push(["zap-max", (zapMax * 1000).toString()]);

  const zapUses = document.getElementById("zapUses").value;
  if (zapUses != "") tagsList.push(["zap-uses", zapUses]);
  const zapLNURL = document.getElementById("overrideLNURL").value;
  if (zapLNURL != "") tagsList.push(["zap-lnurl", zapLNURL]);
  const zapPayer = document.getElementById("zapPayer").value;
  if (zapPayer != "") {
    console.log(zapPayer);
    let payerHEX = NostrTools.nip19.decode(zapPayer);
    console.log(payerHEX);
    if (payerHEX.type == "npub" && payerHEX.data) {
      tagsList.push(["zap-payer", payerHEX.data]);
    } else return console.log("Insert Payer NPUB.");
  }

  // Add client tag
  tagsList.push(["client", "PubPay.me"]);

  // Add mention tags if content has npubs
  let npubMention = payNoteContent.match(
    /(nostr:|@)?((npub)1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/gi
  );
  if (npubMention) {
    npubMention.forEach(function (value) {
      console.log(value.replace("nostr:", ""));
      let hexMention = NostrTools.nip19.decode(value.replace("nostr:", ""));
      console.log(hexMention.data);
      tagsList.push(["p", hexMention.data, "", "mention"]);
    });
  }

  let kind1 = {
    kind: 1,
    created_at: Math.floor(Date.now() / 1000),
    tags: [["t", "pubpay"], ...tagsList],
    content: payNoteContent,
  };
  let kind1Finalized;
  if (!signIn.getPublicKey()) {
    console.log("Trying to sign event but no public key.");
    return;
  }
  const signInMethod = signIn.getSignInMethod();
  console.log("SignIn Method: ", signInMethod);
  if (!signInMethod) {
    console.log("Invalid Sign In Method");
    return;
  }
  if (signInMethod == "extension") {
    if (window.nostr != null) {
      kind1Finalized = await window.nostr.signEvent(kind1);
    }
  } else if (signInMethod == "externalSigner") {
    kind1.pubkey = signIn.getPublicKey();
    kind1.id = NostrTools.getEventHash(kind1);
    const eventString = JSON.stringify(kind1);
    sessionStorage.setItem(
      "SignKind1",
      JSON.stringify({
        event: kind1,
      })
    );
    window.location.href = `nostrsigner:${eventString}?compressionType=none&returnType=signature&type=sign_event`;
  } else if (signInMethod == "nsec") {
    const privateKey = signIn.getPrivateKey();
    console.log(privateKey);
    let { type, data } = NostrTools.nip19.decode(privateKey);
    kind1Finalized = NostrTools.finalizeEvent(kind1, data);
  }
  let isGood = NostrTools.verifyEvent(kind1Finalized);
  if (!isGood) {
    console.log("Invalid Finalized Event.");
    return;
  }
  await Promise.any(pool.publish(relays, kind1Finalized));
  document.getElementById("postNote").innerText = "Publishing...";
  //console.log('published to at least one relay!')
  setTimeout(function () {
    let newNoteForm = document.getElementById("newPayNoteForm");
    newNoteForm.style.display = "none";
    document.getElementById("postNote").innerText = "Post Note";
  }, 1000);
}

document.addEventListener("visibilitychange", async function () {
  if (document.visibilityState === "visible") {
    while (!document.hasFocus()) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const signInData = JSON.parse(sessionStorage.getItem("signIn"));
    if (signInData && signInData.rememberMe !== undefined) {
      sessionStorage.removeItem("signIn");
      const npub = await util.accessClipboard();
      const decodedNPUB = NostrTools.nip19.decode(npub);
      const pubKey = decodedNPUB.data;
      if (signInData.rememberMe === "true") {
        localStorage.setItem("publicKey", pubKey);
        localStorage.setItem("signInMethod", "externalSigner");
      } else {
        sessionStorage.setItem("publicKey", pubKey);
        sessionStorage.setItem("signInMethod", "externalSigner");
      }
      document.getElementById("signInexternalSigner").innerText = "Signer";
      subscribeKind0();
      return;
    }

    const eventStorage = JSON.parse(sessionStorage.getItem("SignZapEvent"));
    if (eventStorage) {
      sessionStorage.removeItem("SignZapEvent");
      const eventSignature = await util.accessClipboard();
      let eventSigned = eventStorage.event;
      eventSigned["sig"] = eventSignature;
      //zapFinalized = await window.NostrTools.finalizeEvent(eventStorage.event, eventSignature)
      //console.log('eventSigned', eventSigned)
      const verifiedEvent = NostrTools.verifyEvent(eventSigned);
      if (verifiedEvent == true) {
        await zap.getInvoiceandPay(
          eventStorage.callback,
          eventStorage.amount,
          eventSigned,
          eventStorage.lud16,
          eventStorage.id
        );
      }
    }

    const Kind1storage = JSON.parse(sessionStorage.getItem("SignKind1"));
    if (Kind1storage) {
      sessionStorage.removeItem("SignKind1");
      const eventSignature = await util.accessClipboard();
      let eventSigned = Kind1storage.event;
      eventSigned.sig = eventSignature;
      const verifiedEvent = NostrTools.verifyEvent(eventSigned);
      if (verifiedEvent == false) {
        alert("Invalid Finalized Event.");
        return;
      }
      if (verifiedEvent == true) {
        await Promise.any(pool.publish(relays, eventSigned));
        setTimeout(function () {
          let newNoteForm = document.getElementById("newPayNoteForm");
          newNoteForm.style.display = "none";
        }, 1000);
      }
    }
  }
});

window.addEventListener("scroll", async () => {
  if (
    window.innerHeight + window.scrollY >= document.body.offsetHeight - 100 &&
    !isLoadingMore
  ) {
    const followingDiv = document.getElementById("following");
    if (followingDiv.style.display == "block") {
      subscribePubPays(kind3PKs, true);
      return;
    } else if (followingDiv.style.display == "none") {
      subscribePubPays(null, true);
      return;
    }
  }
});

document.getElementById("scanQrCode").addEventListener("click", () => {
  const qrScanner = document.getElementById("qrScanner");
  qrScanner.style.display = "flex";
  const html5QrCode = new Html5Qrcode("reader");
  html5QrCode.start(
    { facingMode: "environment" },
    {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    },
    async (decodedText) => {
      console.log("QR Code scanned:", decodedText);
      html5QrCode.stop().then(() => {
        qrScanner.style.display = "none";
      });
      handleScannedContent(decodedText);
    },
    (errorMessage) => {
      console.error("QR Code scanning error:", errorMessage);
    }
  );
  document.getElementById("stopScanner").addEventListener("click", () => {
    html5QrCode.stop().then(() => {
      qrScanner.style.display = "none";
    });
  });
});

async function handleScannedContent(decodedText) {
  try {
    const regex =
      /(note1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,}|nevent1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})/i;
    const match = decodedText.match(regex);
    decodedText = match[0];
    const decoded = NostrTools.nip19.decode(decodedText);

    if (decoded.type === "note") {
      window.location.href = `/?note=${decodedText}`;
    } else if (decoded.type === "nevent") {
      const noteID = decoded.data.id;
      const note1 = NostrTools.nip19.noteEncode(noteID);
      console.log("Converted nevent to note:", note1);
      window.location.href = `/?note=${note1}`;
    } else {
      console.error("Invalid QR code content. Expected 'note' or 'nevent'.");
    }
  } catch (error) {
    console.error("Failed to decode QR code content:", error);
  }
}
