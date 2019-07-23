const express = require('express')
const Promise = require('promise');
const _ = require('lodash');
const multer = require('multer');
const upload = multer();
const cookieParser = require('cookie-parser');
const berlioz = require('berlioz-sdk');
const app = express();
app.use(cookieParser());
app.use(express.json());
berlioz.setupExpress(app);
berlioz.addon(require('berlioz-gcp'));

const ImagesClient = berlioz.database('images').client('storage');

app.use(express.static('public'));
app.set('view engine', 'ejs');

app.get('/', function (req, response) {
    const cookie=req.cookies;
    if(!cookie || !cookie.user){
        response.render('pages/createuser');
        return
    }
    response.writeHead(301,{ Location: '/chat' });
    response.end();
});

app.get('/logout', function (req, response) {
    response.clearCookie("user");
    response.writeHead(301,{ Location: '/' });
    response.end();
});

app.post('/', (request, response) => {
    const userName=request.body.u;
    const options = { url: '/newuser', method: 'POST', body: request.body, json:true };
    return berlioz.service('app').request(options)
        .then(_ => {
            response.cookie("user", userName,{ maxAge: 31556952, httpOnly: true }); 
            response.sendStatus(200);   
        })
        .catch(err => {
            const errorMess=err.error;
            if(errorMess.no==1062){//errorMess.no is 1062 and errorMess.error is "ER_DUP_ENTRY" if duplicated user
                response.sendStatus(409);
                return
            }
            response.status(500).send(errorMess);
        });
});

app.get('/chat', (request, response) => {
    const cookie=request.cookies;
    if(!cookie || !cookie.user){
        response.writeHead(301,{ Location: '/' });
        response.end();
        return
    }
    let renderData = {
        messages: [],
        myid: cookie.user
    };
    let options = { url: '/getmessages', json: true, resolveWithFullResponse: true };
    return berlioz.service('app').request(options)
        .then(result => {
            if (result) {
                renderData.messages = result.body;
            }
        })
        .catch(error => {
            if (error instanceof Error) {
                renderData.error = error.stack + error.stack;
            } else {
                renderData.error = JSON.stringify(error, null, 2);
            }
        })
        .then(() => {
            response.render('pages/chat', renderData);
        });
        
});

app.post('/chat/text', (request, response) => { 
    let data=request.body;
    const cookie=request.cookies;
    data.u= cookie.user;
    const options = { url: '/newmessagetext', method: 'POST', body: data, json: true };
    return berlioz.service('app').request(options)
        .then(result => {
            response.sendStatus(200);
        })
        .catch(error => {
                response.status(500).send(error);
        })
});
    
app.post('/chat/img', upload.single('img'), (request, response) => { 
    const userName=request.cookies.user;
    const url=`/newmessageimg?u=${userName}`;
    request.url=url;
    let formData={img:{value:request.file.buffer,options:{filename:"nfile"}},mimetype:request.file.mimetype};
    const options = { url: url, method: 'POST', formData :formData};
    return berlioz.service('app').request(options)
        .then(_ => {
            response.sendStatus(200);
        })
        .catch(error => {
                response.status(500).send(error);
        })
});

app.post('/chat/search', (request, response) => {
    const from=request.body.f;
    const url='/getmessages?from='+from;
    const options = { url: url};
    return berlioz.service('app').request(options)
        .then(result => {
            if(result.length==0){
                response.sendStatus(204);
            }else{
                response.status(200).send(result);
            }
        })
        .catch(error => {
            response.status(409).send(error)
        });
});


app.get('/static', (request, response) => {
    const query=request.query;
    const id=query.id;
    const url='/getmimetype?id='+id;
    const options = { url: url};
    return berlioz.service('app').request(options)
    .then(mimetype => {
        response.setHeader("Content-Type",mimetype);
        response.setHeader("Cache-control", "must-revalidate,max-age=31536000");
        return ImagesClient.file(id).createReadStream()
    }).then(stream => {
        stream.on('end', () => {
            response.end();
        });
        stream.on('error', (error) => {
            console.log(error);
            response.end();
        });
        stream.pipe(response);
    })
    .catch(error => {
        response.status(404).send(error)
    });
        
});

app.listen(process.env.BERLIOZ_LISTEN_PORT_DEFAULT, process.env.BERLIOZ_LISTEN_ADDRESS, (err) => {
    if (err) {
        return console.log('something bad happened', err)
    }
    console.log(`server is listening on ${process.env.BERLIOZ_LISTEN_ADDRESS}:${process.env.BERLIOZ_LISTEN_PORT_DEFAULT}`)
})
