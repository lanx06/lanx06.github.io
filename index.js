
var skill=[
	
	{src:"./img/js.png",name:"js",href:""},
	{src:"./img/jquery.png",name:"jquery",href:""},
	{src:"./img/vuejs.png",name:"vue.js",href:""},
	{src:"./img/api.png",name:"api",href:""},

	{src:"./img/github.png",name:"github",href:""},
	{src:"./img/python.png",name:"python",href:""},
	{src:"./img/opencv.png",name:"opencv",href:""},
	{src:"./img/colab.png",name:"colab",href:""},
	{src:"./img/tensorflow.png",name:"tensorflow",href:""},

	{src:"./img/unity.png",name:"unity",href:""},
	{src:"./img/unreal.png",name:"unreal",href:""},

]
function add_img() 
{
	var skill_div=$("."+"skill_tool")[0] 
	for (var i = 0; i < skill.length; i++) {
		var div =document.createElement("div")
		div.className="img_div"
		var data= skill[i]
		var img= document.createElement("img")
		img.src=data["src"]
		img.href=data["href"]
		var title=document.createElement("h3")
		title.innerHTML=data["name"]

		console.log(data["name"])
		div.appendChild(img)
		div.appendChild(title)

		skill_div.appendChild(div)
		
	}
	// body...
}

