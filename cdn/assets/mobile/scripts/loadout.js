Creators.Mobile.Loadout = {
	ChangeType: function(el,type) {
		document.querySelector(".loadout-slots .active").classList.remove("active");
		document.querySelector(".loadout-sections .active").classList.remove("active");
		el.classList.add("active");
		document.querySelector(`.loadout-slots .${type}`).classList.add("active");
	},
	TogglePreview: function() {
		document.querySelector("main").classList.toggle("loadout-preview");
		if(!this.preview&&this.loadout && Creators.LoadoutPreview) {
			this.preview = new Creators.LoadoutPreview("loadout-preview",this.loadout);
		}
	},
	ClassList: {
		get DOM(){return document.querySelector(".classlist")},
		get lastX() {return getPos(this.DOM.children[this.DOM.children.length-1]).x},
		get active() {return document.querySelector(".classlist .active");},
		get x() {
			return parseInt(this.DOM.style.left)
		},
		set x(x) {
			this.DOM.style.left = x+"px";
		},
		updateActive() {
			if(this.active)this.active.classList.remove("active");
			let nextActive = Array.from(this.DOM.children).filter(c=>getPos(c).x>0)[0]
			if(nextActive) nextActive.classList.add("active");
		},
		fixPos() {
			if(!this.active) {
				this.x = this.startX;
				this.updateActive()
				return;
			}
			this.x = 0
			this.x = -getPos(this.active).x+32;
			if(location.href.split("#")[0] !== this.active.href)location.replace(this.active.href);
		}
	}
}

window.addEventListener("load",()=>{
	//Creators.Mobile.Loadout.TogglePreview()

	let head = document.body,
	classlist = document.querySelector(".classlist"),
	startX,
	isDown,
	left;

	head.addEventListener("touchstart",t=>{
		//t.preventDefault();
		let e = t.touches[0];
		isDown = true;
		left = parseFloat(classlist.style.left);
		startX = e.pageX;
	})
	head.addEventListener("touchend",t=>{
		//t.preventDefault();
		//let e = t.touches[0];
		isDown=false;
		Creators.Mobile.Loadout.ClassList.fixPos();
	})
	head.addEventListener("touchmove",t=>{
		if(!isDown) return;
		//t.preventDefault();
		let e = t.touches[0];
		let deltaX = e.pageX - startX,
		x= .7*deltaX + left;
		Creators.Mobile.Loadout.ClassList.x = x
		Creators.Mobile.Loadout.ClassList.updateActive();

	})
})