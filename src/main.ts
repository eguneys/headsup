import sprites_png from '../assets/sprites.png'
import { Soli2d, loop } from 'soli2d'
import Input from './input'
import AllPlays from './play'

function load_image(path: string): Promise<HTMLImageElement> {
  return new Promise(resolve => {
    let res = new Image()
    res.onload = () => resolve(res)
    res.src = path
  })
}


export default function app(element: HTMLElement) {

  load_image(sprites_png).then(image => {

    let [_render, root] = Soli2d(element, image, 320, 180)

    let input = new Input().init()

    let ctx = {
      input,
      image
    }

    let play = new AllPlays(ctx, root).init()

    loop((dt, dt0) => {
      input.update(dt, dt0)
      play.update(dt, dt0)

      _render()
    })
  })

}
