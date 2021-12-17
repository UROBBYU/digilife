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
					this.lines = blockFile.split('\n')
					this.vars = {}
					this.slides = {}
					let curSlide = ''
					let stage = 0
					for (const line of this.lines) {
						switch (stage) {
							case 0:
								if (/#\w+?:.+/.test(line)) {
									const arr = /#(\w+?):(.+)/.exec(line)
									this.vars[arr[1].trim()] = arr[2].trim()
								} else if (/\$\w+?/.test(line)) {
									curSlide = line.substring(1)
									this.slides[curSlide] = {
										buttons: {},
									}
									stage = 1
								}
								break
							case 1:
								if (/@.+/.test(line)) {
									this.slides[
										curSlide
									].upper = `<img class="main-image" src="${line.substring(
										1
									)}"/>`
								} else if (/'.+'/.test(line)) {
									this.slides[curSlide].upper = line
								}
								stage = 2
								break
							case 2:
								if (line.length > 0) {
									this.slides[curSlide].lower = line
								}
								stage = 3
								break
							case 3:
								if (/.+-> *[$@\.].+/.test(line)) {
									const arr = /(.+)->(.+)/.exec(line)
									this.slides[curSlide].buttons[
										arr[1].trim()
									] = arr[2].trim()
								} else {
									stage = 0
								}
								break
						}
					}
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
				window.a = new Block(blockName)
			})
			gameList.append(elem)
		}
	})
