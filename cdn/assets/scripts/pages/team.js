if(!Creators) windows.Creators = {};
(function(){
	let page = document.getElementsByClassName("post-content")[0];

	Creators.FilterTeam = function(role) {
		document.getElementById("role-"+role+"-button").classList.toggle("active")
		page.classList.toggle("role-"+role)
	}
})();