const main = async () => {

let docId = window.location.hash.replace(/^#/, '')
// Simulate lan by using webworker which communicates with all same-origin (in
// our case with all localhost) across tabs, iframes, etc. Allowing us to
// communicate across tab.s
let channel = new BroadcastChannel(docId)

// console.log(docId)
// global variable, doc
let doc = Automerge.init()

// binary state of our doc
let binary
// to have correct priority settings for items.
let currentPriority = 0

// async function loadFromLocal(docId) {
//  binary = await localforage.getItem(docId)
//  // load and render doc if it exists
//  if (binary) {
//    console.log("loading doc from localstorage")
//    doc = Automerge.load(binary)
//    updateDoc(doc)
//    currentPriority = Math.max(doc.items.map((item) => item.priority)) + 1
//    console.log("new prio: ",currentPriority)
//  }
// }

// first get local state from localstorage.
// try {
// await loadFromLocal(docId)
// } catch (err) {
//     console.log(err)
// }

// then load/merge remote state from server
try {
await loadFromRemote(docId)
} catch (err) {
    console.log(err)
}

// console.log(doc)
let actorId = Automerge.getActorId(doc)
// console.log(actorId)

// make changes to a document
// also makes sure to re-render on changes
function updateDoc(newDoc) {
  console.log("update doc..")
  doc = newDoc
  render(doc)
  binary = Automerge.save(newDoc)
  localforage.setItem(docId, binary).catch(err => console.log(err))
  // let other users/browser tabs now there is a new doc.
  channel.postMessage(binary)
  // uncomment this to auto update to remote server when we add a todo
  // saveToRemote(docId, binary)
}

// listens to postMessage events from other tabs.
channel.onmessage = (ev) => {
  console.log("old doc: ", doc)
  const newDoc = Automerge.merge(doc, Automerge.load(ev.data))
  console.log("new doc: ", newDoc)
  updateDoc(newDoc)
}

// sends binary of document to our remote server
async function saveToRemote(docId, binary) {
  console.log("storing on remote..")
  fetch(`http://localhost:5000/${docId}`, {
    body: binary,
    method: "post",
    headers: {
      "Content-Type": "application/octet-stream",
    }
  })
}

// loads doc from remote server
async function loadFromRemote(docId) {
  console.log("loading from remote..")
  const response = await fetch(`http://localhost:5000/${docId}`)
  if (response.status !== 200) throw new Error('No saved draft for doc with id=' + docId)
  const respbuffer = await response.arrayBuffer()
  if (respbuffer.byteLength === 0) throw new Error('No saved draft for doc with id=' + docId)
  binary = new Uint8Array(respbuffer)
  let newDoc = Automerge.merge(doc, Automerge.load(binary))
  updateDoc(newDoc)
  currentPriority = Math.max(... doc.items.map((item) => item.priority)) + 1
  console.log("new prio: ",currentPriority)
}

// adds an item to the todo list
function addItem(text) {
  let newDoc = Automerge.change(doc, doc => {
    if (!doc.items) doc.items = []
    doc.items.push({ text, done: false, priority: currentPriority })
    currentPriority = currentPriority + 1
  })
  updateDoc(newDoc)
}

// toggles a given todo
function toggle(index) {
  let newDoc = Automerge.change(doc, (doc) => {
      console.log("toggling..")
      const done = doc.items[index].done
      console.log("previous done: ", done)
      console.log("future done: ", !done)
      doc.items[index].done = !done
  })
  updateDoc(newDoc)
}

// handle swapping two items
function swap(a=0, b=1) {
    let newDoc = Automerge.change(doc, doc => {
        // case no items yet
        if (!doc.items) {
            doc.items = []
        }
        // try with copy to fix issues?
        // const copy = JSON.parse(JSON.stringify(doc.items))
        // doc.items[a].priority = copy[b].priority
        // doc.items[b].priority = copy[a].priority

        // get items at index and swap them
        const prioItemB = doc.items[b].priority
        const prioItemA = doc.items[a].priority
        doc.items[a].priority = prioItemB
        doc.items[b].priority = prioItemA
    })
  updateDoc(newDoc)
}

let swapForm = document.querySelector("#swap-item-form")
let swapFormInputA = document.querySelector("#a")
let swapFormInputB = document.querySelector("#b")
swapForm.onsubmit = (ev) => {
    ev.preventDefault()
    if (!swapFormInputA.value && !swapFormInputB.value){
        swap()
    }
    else {
    swap(swapFormInputA.value, swapFormInputB.value)
    }
}

// handle text input of todo
let form = document.querySelector("#add-item-form")
let input = document.querySelector("#new-todo")
form.onsubmit = (ev) => {
  ev.preventDefault()
  addItem(input.value)
  input.value = null
}

// send our notes to remote when we click the button
let storeOnRemoteBtn = document.querySelector("#store")
storeOnRemoteBtn.onclick = async (_) => {
    try {
      await saveToRemote(docId,binary)
} catch (err) {
    console.log(err)
}

}

// load our notes from remote when we click the button
let loadFromRemoteBtn = document.querySelector("#load")
loadFromRemoteBtn.onclick = async (_) => {
    try {
await loadFromRemote(docId)
} catch (err) {
    console.log(err)
}
}


// displays all our items of our doc.
function render(doc) {
  let list = document.querySelector("#todo-list")
  list.innerHTML = ''
  if(!doc.items) {
      return
  }

  const sortedItems = doc.items.sort((a,b) => a.priority - b.priority)

  sortedItems.forEach((item, index) => {
    let itemEl = document.createElement('li')
    itemEl.innerText = `${item.text} priority: ${item.priority}`
    itemEl.style = item.done ? 'text-decoration: line-through' : ''
    list.appendChild(itemEl)
    // adds on click listener to each list item.
    itemEl.onclick = function(_) {
       console.log(`item with index: ${index} was clicked.`)
       toggle(index)
    }
  })
}

}

main()
