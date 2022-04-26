const Automerge = require('automerge')

const express = require('express')
const path = require('path')
const fs = require('fs')
const cors = require('cors')
const bodyParser = require('body-parser')

let app = express()
var options = {
    inflate: true,
    limit: '100kb',
    type: 'application/octet-stream'
}
app.use(bodyParser.raw(options))

// creates data dir
try {
    fs.mkdirSync(path.join(__dirname, 'data'))
} catch (err) {
    if (err.code !== 'EEXIST') {
        console.error(err)
    }
}

app.use(cors())

// Read file from storage for given id and send it.
app.get('/:id', (req, res) => {
    let id = req.params.id
    let filename = path.join(__dirname, 'data', id)
    fs.stat(filename, (err, stats) => {
        if (err) {
            console.error(err)
            res.status(404).send('Not found')
        } else {
            res.sendFile(filename)
            console.log('sending')
        }
    })
})

// Write file to storage for given id.
app.post('/:id', async (req, res) => {
    let id = req.params.id
    const filename = path.join(__dirname, 'data', id)
    try {
        const currentDoc = fs.readFileSync(filename)
        try {
        // we have an existing file -> we have an existing doc.
        console.log("merging")
        // const mergedDoc = Automerge.merge(currentDoc, Automerge.load(req.body))
        const mergedDoc = Automerge.merge(Automerge.load(currentDoc), Automerge.load(req.body))
        const binary = Automerge.save(mergedDoc)
        fs.writeFileSync(path.join(__dirname, 'data', id), binary)
        res.status(200).send('ok')
        } catch (err) {
           // merging failed input and existing doc failed.
           console.log("error merging: ", err)
           res.status(400).send('error merging')
        }
    } catch (err) {
        // we have no existing file. just save the binary input as file.
        console.log("not merging. Storing as file.")
        fs.writeFileSync(path.join(__dirname, 'data', id), req.body)
        res.status(200).send('ok')
    }
})

const port = 5000

// spin up the server
app.listen(port, () => {
    console.log('listening on http://localhost:' + port)
})
