# Quickstart

- in root dir `npx http-server`
- in ./remote-server `npm i && npm run watch`

# Problem reproduction
- Open browser in any given url. E.g. localhost:8080/#test
- Add two or more items.
- Swap two items. It does work.
- But when we now try to toggle an item that was swapped before we get an error
  inside automerge. Error:
```
Uncaught RangeError: Cannot find path object with objectId 2@0cf1fa4025f544248ad130697c0a02aa
    getSubpatch context.js:165
    applyAtPath context.js:317
    setMapKey context.js:339
    set proxies.js:128
    newDoc index.js:113
    R index.js:246
    u automerge.js:34
    toggle index.js:108
    onclick index.js:201
    render index.js:199
    render index.js:193
    updateDoc index.js:53
    swap index.js:136
    onsubmit index.js:148
context.js:165
    getSubpatch context.js:165
    applyAtPath context.js:317
    setMapKey context.js:339
    set proxies.js:128
    newDoc index.js:113
    R index.js:246
    u automerge.js:34
    toggle index.js:108
    onclick index.js:201
    (Async: EventHandlerNonNull)
    render index.js:199
    forEach self-hosted:167
    render index.js:193
    updateDoc index.js:53
    swap index.js:136
    onsubmit index.js:148
```
