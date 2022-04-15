import './index.css'
import sprites_png from '../assets/sprites.png'
import Snabbdom from './snabbdom'
import view from './view'
import Ctrl from './ctrl'

function load_image(path: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}

export default function app(element: HTMLElement) {

  load_image(sprites_png).then(image => {
    let ctrl = new Ctrl()._set_data(image).init()
    let redraw = Snabbdom(element, () => view(ctrl))
    ctrl._set_redraw(redraw)
  })

}
