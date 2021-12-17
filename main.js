window.createElement = (html) => {
	const tmp = document.createElement('template')
	tmp.innerHTML = html.trim()
	return tmp.content.firstChild
}

class Block {
	constructor(name) {
		if (typeof name == 'string' && name.length > 0)
			fetch('tests/' + name)
				.then((d) => d.text())
				.then((blockFile) => {
					console.log(blockFile)
				})
	}
}

const updateScale = () => {
	let blocks = document.querySelectorAll('.game-block')
	for (const block of blocks) {
		block.style.setProperty('--scale', window.innerHeight / 960)
	}
}
updateScale()
window.addEventListener('resize', updateScale)

const blockText = `
<div class="game-block">
	<div class="header">
		<div class="title">Якийсь рандомний текст</div>
		<div class="button close">&times;</div>
	</div>
	<img class="main-image" src="https://urepo.com.ua/img/Ghost%20Logo.svg"></img>
	<div class="controls">
		<div class="title">Вибір ваш:</div>
		<div class="buttons">
			<div>Кнопка1</div>
			<div>Кнопка2</div>
			<div>Кнопка з купою тексту</div>
		</div>
	</div>
</div>`

const gameList = document.querySelector('.game-list')

fetch('tests.json')
	.then((d) => d.json())
	.then((blockList) => {
		for (const blockName of blockList) {
			const elem = createElement(`<div class="button">${blockName}</div>`)
			elem.addEventListener('click', () => {
				const a = new Block(blockName)
			})
			gameList.append(elem)
		}
	})
