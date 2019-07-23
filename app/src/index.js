const express = require('express');
const berlioz = require('berlioz-sdk'); 
const _ = require('lodash');
const multer = require('multer');
const upload = multer();
const Promise = require('the-promise');
const uuid = require('uuid/v4');
const Readable = require('stream').Readable;

const app = express();
berlioz.setupExpress(app);
berlioz.addon(require('berlioz-gcp'));

const ChatClient = berlioz.database('chat').client('mysql', {
    user: 'root',
    password: '',
    database: 'demo'
});

const ImagesClient = berlioz.database('images').client('storage');
function escape(s) {
    return s.replace(/[&"<>]/g, function (c) {
        return {'&': "&amp;",'"': "&quot;",'<': "&lt;",'>': "&gt;"}[c];
    });
}
app.get('/', (request, response) => {
    let data = {
        myId: process.env.BERLIOZ_TASK_ID,
        message: 'Hello From App Tier',
        myDbPeers: berlioz.database('chat').all()
    }
    response.send(data);
})

app.post('/newuser', (request, response) => {
    if (!request.body.u) {
        return response.send({error: 'Missing username'});
    }
    const timeUnix=new Date();
    const userName=request.body.u;
    const query= `INSERT INTO users(Username, Registrationday) VALUES('${userName}', '${timeUnix.getTime()}')`;
    return executeQuery(query)
        .then(_ => {
            response.sendStatus(200);
        })
        .catch(err => {
            response.status(400).send({
                error: err.message,
                no: err.errno 
             });
        })
})

app.post('/newmessagetext', (request, response) => {
    if (!request.body.m || !request.body.u ) {
        return response.send({error: 'Missing text'});
    }
    const timeUnix=new Date();
    const text=escape(request.body.m);
    const userid=request.body.u;
    const query= `INSERT INTO chat(Content, Datesend, Typemess, Fromuser) VALUES('${text}', '${timeUnix.getTime()}','1','${userid}')`;
    return executeQuery(query)
        .then(_ => {
            response.sendStatus(200);
        })
        .catch(err => {
            response.status(400).send({
                error: err.message,
                no: err.errno 
             });
        })
})
app.post('/newmessageimg', upload.single('img'),async (request, response) => {
    const timeUnix=new Date();
    const userid=request.query.u;
    const mimetype=request.body.mimetype;
    const id=uuid();
    const stream = new Readable();
    stream.push(request.file.buffer);
    stream.push(null);
    await uploadImage(id,stream);

    const query= `INSERT INTO chat(Content, Datesend, Typemess, Fromuser,MimeType) VALUES('${id}', '${timeUnix.getTime()}','2','${userid}','${mimetype}')`;
    
    return executeQuery(query)
        .then(_ => {
            response.sendStatus(200);
        })
        .catch(err => {
            response.status(400).send({
                error: err.message,
                no: err.errno 
             });
        })
})
app.get('/getmessages', (request, response) => {
    let querysql="";
    const query=request.query;
    if(query && query.from){
        let from=query.from;
        querysql=`SELECT Content,Datesend,Typemess,Fromuser FROM chat WHERE Datesend > ${from} ORDER BY Datesend ASC`;
    }else{
        querysql='SELECT Content,Datesend,Typemess,Fromuser FROM chat ORDER BY Datesend ASC';
    }
    return executeQuery(querysql)
        .then(messages => {
            response.send(messages);
        })
        .catch(reason => {
            response.status(400).send({
               error: reason.message
            });
        })
})

app.get('/getmimetype', (request, response) =>{
    const query=request.query;
    const id=query.id;
    const querysql=`SELECT MimeType FROM chat WHERE Content = '${id}'`;
    return executeQuery(querysql)
    .then(mimeType => {
        if(mimeType.length==0){
            response.sendStatus(404);
            return Promise.reject("nop")
        }
        response.send(mimeType[0].MimeType);
    })
    .catch(reason => {
        if(reason=="nop")return
        response.status(400).send({
           error: reason.message
        });
    })
})

function uploadImage(name,stream){
    return new Promise((resolve, reject) => {
        ImagesClient
            .file(name)
            .createWriteStream()
            .then(writeStream => {
                stream.pipe(writeStream)
                    .on('error', (error) => {
                        reject(error);
                    })
                    .on('finish', () => {
                        resolve();
                    });
            })
            .catch(reason => {
                reject(reason);
            });
    });
}


function executeQuery(querySql){
    return ChatClient.query(querySql);
}

app.listen(process.env.BERLIOZ_LISTEN_PORT_DEFAULT,
    process.env.BERLIOZ_LISTEN_ADDRESS, (err) => {
if (err) {
 return console.log('something bad happened', err)
}

console.log(`server is listening on ${process.env.BERLIOZ_LISTEN_ADDRESS}:${process.env.BERLIOZ_LISTEN_PORT_DEFAULT}`)
})