class Chat{
    constructor(){
        this.sendMessage=this.sendMessage.bind(this);
        this.searchMessagesAfter=this.searchMessagesAfter.bind(this);
        this.sendImgMess=this.sendImgMess.bind(this);
        this.messages=document.querySelector("#messages");
        this.messagesWrapper=document.querySelector("#messagesWrapper");
        this.waiting=document.querySelector("#waiting");
        this.tmpl=document.querySelector("#tmplMesage").content.querySelector(".message");
        this.inputMessage=document.querySelector("#newMessage .textBox");
        this.updateBtn=document.querySelector("#up .update");
        this.error=document.querySelector("#errorMessage");
        this.imgBtn=document.querySelector("#imgBtn");
        this.imgInput=document.querySelector("#imgBtn input");
        this.mesBtn=document.querySelector("#mesBtn");
        this.lastmessagedate=0;
        this.meid="";
        this.start();
    }
    start(){
        const body=document.querySelector("body");
        this.meid=body.dataset.meid;
        let form=document.querySelector("#newMessage");
        form.addEventListener("submit",this.sendMessage);
        const userDates=document.querySelectorAll("#messages .message .userDate");
        for(let i=0,tam=userDates.length;i<tam;i++){
            const message= userDates[i];
            const date=new Date(parseInt(message.dataset.when));
            message.textContent=date.toLocaleString();
        }
        const messagesNames=document.querySelectorAll("#messages .userName");
        for(let i=0,tam=messagesNames.length;i<tam;i++){
            const messageName= messagesNames[i];
            if(messageName.textContent==this.meid){
                messageName.parentElement.parentElement.classList.add("me");
            }
        }
        const msgs=document.querySelectorAll("#messages .message .userDate");
        if(msgs.length!=0){
            this.lastmessagedate=msgs[msgs.length-1].dataset.when;
        }
        this.updateBtn.addEventListener("click",this.searchMessagesAfter);
        this.imgInput.addEventListener("change",this.sendImgMess);
        this.inputMessage.addEventListener("input",()=>{
            if(this.inputMessage.value.trim()==""){
                this.imgBtn.style.display="flex";
                this.mesBtn.style.display="none";
            }else{
                this.imgBtn.style.display="none";
                this.mesBtn.style.display="flex";
            }
        },{passive:true});
        this.imgBtn.addEventListener("click",_=>{this.imgInput.click()});
        setTimeout(_=>{
            this.messagesWrapper.scrollTop=this.messages.getBoundingClientRect().height;
        },400);
    }
    putMessagesAfter(messages){
        for(let i=0,tam=messages.length;i<tam;i++){
            const info=messages[i];
            const nuevo=this.tmpl.cloneNode(true);
            nuevo.dataset.type=info.Typemess;
            nuevo.querySelector(".userName").textContent=info.Fromuser;
            if(info.Fromuser==this.meid){
                nuevo.classList.add("me");
            }
            const date=new Date(parseInt(info.Datesend));
            const userDate=nuevo.querySelector(".userDate");
            userDate.dataset.when=info.Datesend;
            userDate.textContent=date.toLocaleString();
            nuevo.querySelector(".spinning").remove();
            if(info.Typemess=="1"){
                nuevo.querySelector(".userText").textContent=info.Content;
            }else if(info.Typemess=="2"){
                nuevo.querySelector(".userImg").src="/static?id="+info.Content;
            }
            this.messages.appendChild(nuevo);
        }
        this.messagesWrapper.scrollTop=this.messages.getBoundingClientRect().height;
    }
    sendMessage(e){
        e.preventDefault();
        const nuevo=this.tmpl.cloneNode(true);
        nuevo.querySelector(".userText").textContent=this.inputMessage.value;
        nuevo.querySelector(".userName").textContent=this.meid;
        const date=new Date();
        const unixmili=date.toLocaleString();
        nuevo.querySelector(".userDate").textContent=unixmili;
        nuevo.dataset.type="1";
        nuevo.dataset.when=unixmili;
        nuevo.classList.add("me");
        this.messages.appendChild(nuevo);
        this.messages.appendChild(this.waiting);//to move down the waiting img
        this.messagesWrapper.scrollTop=this.messages.getBoundingClientRect().height; 
        const send=JSON.stringify({m:this.inputMessage.value});
        this.inputMessage.value="";
        this.imgBtn.style.display="flex";
        this.mesBtn.style.display="none";
        this.inputMessage.focus();
        fetch("/chat/text",{credentials: 'include',method:"POST",body:send, headers: {
            'Content-Type': 'application/json'
          }})
        .then(resp => {
           this.waiting.style.display="none";
           switch (resp.status){
               case 200:
                    nuevo.querySelector(".spinning").remove();
                    return Promise.reject("nop")
               case 409:
                    nuevo.remove();
                    return resp.json()
               default:
                    this.error.textContent="Server error";
                   return Promise.reject("server")
           }
       })
       .then(err=>{
            this.error.style.visibility ="visible"; 
            this.error.textContent="Server error: "+ err.error;
            setTimeout(()=>{
                this.error.style.visibility ="hidden"; 
            },3000);
       })
       .catch(err=>{
            if(err=="nop")return
            this.error.style.visibility ="visible"; 
            this.error.textContent="Conection error";
            console.log(err);
        })
    }
    sendImgMess(e){
        e.preventDefault();
        const nuevo=this.tmpl.cloneNode(true);
        const file=this.imgInput.files[0];
        nuevo.querySelector(".userImg").src=window.URL.createObjectURL(file);
        nuevo.querySelector(".userName").textContent=this.meid;
        nuevo.dataset.type="2";
        const date=new Date();
        const unixmili=date.toLocaleString();
        nuevo.querySelector(".userDate").textContent=unixmili;
        nuevo.dataset.type="1";
        nuevo.dataset.when=unixmili;
        nuevo.classList.add("me");
        this.messages.appendChild(nuevo);
        this.messages.appendChild(this.waiting);//to move down the waiting img
        this.messagesWrapper.scrollTop=this.messages.getBoundingClientRect().height; 
        this.inputMessage.focus();
        const send=new FormData();
        send.append("img",file);
        fetch("/chat/img",{credentials: 'include',method:"POST",body:send})
        .then(resp => {
           this.waiting.style.display="none";
           switch (resp.status){
               case 200:
                    nuevo.querySelector(".spinning").remove();
                    return Promise.reject("nop")
               case 409:
                    nuevo.remove();
                    return resp.json()
               default:
                    nuevo.remove();
                    this.error.textContent="Server error";
                   return Promise.reject("server")
           }
       })
       .then(err=>{
            this.error.style.visibility ="visible"; 
            this.error.textContent="Server error: "+ err.error;
            setTimeout(()=>{
                this.error.style.visibility ="hidden"; 
            },3000);
       })
       .catch(err=>{
            if(err=="nop")return
            this.error.style.visibility ="visible"; 
            this.error.textContent="Conection error";
            console.log(err);
        })
  }
    searchMessagesAfter(){
        this.waiting.style.display="flex";
        const send=JSON.stringify({f:this.lastmessagedate});
        fetch("/chat/search",{credentials: 'include',method:"POST",body:send, headers: {
            'Content-Type': 'application/json'
          }})
         .then(resp => {
            this.waiting.style.display="none";
            switch (resp.status){
                case 200:
                    return resp.json()
                case 204:
                    return Promise.reject("nop")
                case 500:
                        this.error.style.visibility ="visible"; 
                        this.error.textContent="Server error";
                        return Promise.reject("nop")
                default:
                    return Promise.reject("server")
            }
        })
        .then(data => {
            const messages=document.querySelectorAll("#messages .message .userDate");
            let erase=false;
            for(let i=0,tam=messages.length;i<tam;i++){
                const msg=messages[i];
                if (erase){
                    msg.parentElement.parentElement.remove();
                    continue
                }
                if(this.lastmessagedate==msg.dataset.when){
                    erase=true;
                }
            }
            this.lastmessagedate=data[data.length-1].Datesend;
            this.putMessagesAfter(data);
        })
        .catch(err=>{
            if(err=="nop")return
            console.log(err);
            switch (err){
                case "server":
                        this.error.style.visibility ="visible"; 
                        this.error.textContent="Server error";
                    return
                default:
                        this.error.style.visibility ="visible"; 
                        this.error.textContent="Conection error";
                return
            }
        })
    }
}
let chat=new Chat();