window.createElement = (html) => {
	const tmp = document.createElement('template')
	tmp.innerHTML = html.trim()
	return tmp.content.firstChild
}

class Block {
	constructor(lines, name) {
		this.lines = lines
		this.name = name
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
						let str = line.trim()
						str = str.substring(1, str.length - 1)

						this.slides[curSlide].upper = str
							.split('\\n')
							.map(
								(par) =>
									`<p${
										/.*\\t.+/.test(par)
											? ' data-ctr=""'
											: ''
									}${
										/.*\\s\[.+?,.+?\].+/.test(par)
											? ` style="color:${
													this.vars[
														/.*\\s\[(.+?),.+?\].+/
															.exec(par)[1]
															.trim()
													]
											  };font-size:${
													this.vars[
														/.*\\s\[.+?,(.+?)\].+/
															.exec(par)[1]
															.trim()
													]
											  }"`
											: ''
									}>${par.replace(
										/(\\t)|(\\s\[.+?,.+?\])/g,
										''
									)}</p>`
							)
							.join('')
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
						this.slides[curSlide].buttons[arr[1].trim()] =
							arr[2].trim()
					} else {
						stage = 0
					}
					break
			}
		}
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
;(async () => {
	const blockList = await (await fetch('tests.json')).json()
	const blocks = []
	const promises = []

	for (const blockName of blockList) {
		if (typeof blockName == 'string' && blockName.length > 0) {
			promises.push(
				new Promise(async (res) => {
					blocks.push(
						new Block(
							(
								await (await fetch('tests/' + blockName)).text()
							).split('\n'),
							blockName
						)
					)
					res()
				})
			)
		}
	}

	await Promise.all(promises)

	const gameList = document.querySelector('.game-list')
	const overlay = document.querySelector('.overlay')
	const gameBlock = overlay.querySelector('.game-block')

	overlay.addEventListener('pointerdown', () =>
		overlay.style.removeProperty('display')
	)
	gameBlock.addEventListener('pointerdown', (e) => e.stopPropagation())
	gameBlock
		.querySelector('.close')
		.addEventListener('click', () =>
			overlay.style.removeProperty('display')
		)

	for (const block of blocks) {
		const elem = createElement(`
		<div class="game-item" style="border-color:${block.vars.bd};background-color:${block.vars.bg1};color:${block.vars.fg1}">
			<div class="title">${block.vars.title}</div>
			<img class="icon" src="img/${block.name}.svg"/>
			<div class="button start">Відкрити</div>
		</div>`)

		elem.querySelector('.start').addEventListener('click', () => {
			const firstSlide = block.slides[block.vars.start.substring(1)]

			const upper = gameBlock.querySelector('.upper')
			const lower = gameBlock.querySelector('.controls .title')
			const buttons = gameBlock.querySelector('.controls .buttons')

			gameBlock.querySelector('.header .title').innerText =
				block.vars.title
			gameBlock.style.borderColor = block.vars.bd
			gameBlock.style.backgroundColor = block.vars.bg1
			gameBlock.style.color = block.vars.fg1
			gameBlock
				.querySelector('.controls > .buttons')
				.style.setProperty('--bg', block.vars.bg2)
			gameBlock
				.querySelector('.controls > .buttons')
				.style.setProperty('--fg', block.vars.fg2)

			const updateSlide = (slide) => {
				if (slide.upper) {
					upper.innerHTML = slide.upper
					upper.style.removeProperty('display')
				} else upper.style.display = 'none'
				if (slide.lower) {
					lower.innerText = slide.lower
					lower.style.removeProperty('display')
				} else lower.style.display = 'none'
				if (Object.keys(slide.buttons).length) {
					buttons.innerHTML = ''
					buttons.style.removeProperty('display')
					for (const name in slide.buttons) {
						const val = slide.buttons[name]
						const sstr = val.substring(1)

						let tag = `<div>${name}</div>`
						if (val.startsWith('@'))
							tag = `<a href="${sstr}" target="_blank">${name}</a>`
						const elem = createElement(tag)

						if (val.startsWith('$'))
							elem.addEventListener('click', () =>
								updateSlide(block.slides[sstr])
							)
						else if (val.startsWith('.')) {
							elem.addEventListener('click', () => {
								switch (sstr) {
									case 'end':
										overlay.style.removeProperty('display')
										break
								}
							})
						}

						elem.style.backgroundColor = block.vars.bg2
						elem.style.color = block.vars.fg2

						buttons.append(elem)
					}
				} else buttons.style.display = 'none'
			}

			updateSlide(firstSlide)

			overlay.style.display = 'block'
		})

		gameList.append(elem)
	}
})()
