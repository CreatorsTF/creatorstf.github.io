Creators.Mobile.Loading = {
    get DOM () {
        return document.querySelector(".ctf-pwa-loading >*");
    },
    get amount() {return parseFloat(this.DOM.style.width)||0},
    set amount(w) {this.DOM.style.width = w+"%"},
    done() {
        this.DOM.parentElement.classList.add("done")
    },

    start() {
        this.DOM.parentElement.classList.remove("done")
    }
}

document.addEventListener("readystatechange",e=>{
    console.log({readyState:document.readyState})
    if(document.readyState == "interactive") {
        let all = document.getElementsByTagName("*"),
            increase = 100/all.length;
            console.log({increase,length:all.length, "increase*length":increase*all.length})
        Array.from(all).forEach(element => {
            while(!$(element).on()) {}
            Creators.Mobile.Loading.amount += increase;

        });
    }
    if(document.readyState == "complete") {
        Creators.Mobile.Loading.amount = 100;
        Creators.Mobile.Loading.done()

    }
})

window.addEventListener("beforeunload",e=>{
    Creators.Mobile.Loading.start()
    Creators.Mobile.Loading.amount = 0;
    setTimeout(()=>{
        Creators.Mobile.Loading.amount = 10;
    },0)
})