import sprites_png from '../assets/sprites.png'
import Snabbdom from './snabbdom'
import view from './view'
import Ctrl from './ctrl'
import ground from './ground'
import Api from './api'

function load_image(path: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}

export default function app(element: HTMLElement, config: Config) {
  return load_image(sprites_png).then(image => {
    let [play, dispose] = ground(image, element, config)

    return Api(play)
  })
}
