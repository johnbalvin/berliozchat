class CreateUser{
    constructor(){
        this.create=this.create.bind(this);
        this.spinning=document.querySelector("#spinning");
        this.button=document.querySelector("#buttonWrapper button");
        this.userinput=document.querySelector("#userinput");
        this.me=document.querySelector("#newUser");
        this.errorMes=document.querySelector("#error");
        this.start();
    }
    start(){
        this.me.addEventListener("submit",this.preventDefault);
        this.me.addEventListener("submit",this.create);
    }
    preventDefault(e){
        e.preventDefault();
    }
    create(e){
        this.spinning.style.display="flex";
        this.button.style.display="none";
        this.me.removeEventListener("submit",this.create);
        const send=JSON.stringify({u:this.userinput.value});
        fetch("",{credentials: 'include',method:"POST",body:send, headers: {
            'Content-Type': 'application/json'
          }})
        .then(resp => {
           if (resp.status==200){
                window.location.href = "/chat";
                return
           }
           this.spinning.style.display="none";
           this.button.style.display="flex"; 
           this.errorMes.style.visibility ="visible"; 
           if(resp.status==409){
                this.errorMes.textContent="¡Repeated user, try other user!"; 
                this.me.addEventListener("submit",this.create);
                return
           }
           return resp.json()
           
       }).then(err=>{
            this.errorMes.textContent="Server error: "+ err.error;
       })
       .catch(err=>{
        this.me.addEventListener("submit",this.create);
        this.spinning.style.display="none";
        this.button.style.display="flex";
        console.log(err);
       })
    }
}
new CreateUser();