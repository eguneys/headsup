import sprites_png from '../assets/sprites.png'
import { render, Soli2d } from 'soli2d-js/web'
import Anim from './anim'
import App from './game'
import { Config } from './config'

function load_image(path: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}

export default function app(element: HTMLElement, config?: Config) {
  return load_image(sprites_png).then(image => {

    let anim = new Anim(config)

    let [_render, root, $canvas] = Soli2d(element, image, 320, 180)
    render(App(anim, _render, image, root, $canvas), root)

    return anim
  })
}
