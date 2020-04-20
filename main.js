var spoilerSection = document.querySelector("#spoilers");
spoilerSection.onclick = function() {
	spoilerSection.querySelector(".game-screenshot-spoiler").setAttribute("class", "game-screenshot-spoiler-revealed");
	spoilerSection.setAttribute("id", "spoilers-revealed");
}