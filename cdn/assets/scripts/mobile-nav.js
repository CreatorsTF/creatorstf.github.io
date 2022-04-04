function createNav(mobile_btn,list) {
	document.querySelector(mobile_btn).addEventListener("click",()=>{
		document.querySelector(list).classList.toggle("active")
	});
}


window.addEventListener("load",()=>{
	//createNav("#main-links-dropdown",".main-links")
	createNav(".header_navigation_mobile",".header_navigation")
})
