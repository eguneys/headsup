import sprites_png from '../assets/sprites.png'
import { Soli2d, loop } from 'soli2d'
import Input from './input'
import Mouse from './mouse'
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

    let [_render, root, $canvas] = Soli2d(element, image, 1920, 1080)

    let input = new Input().init()
    let mouse = new Mouse($canvas).init()

    let ctx = {
      mouse,
      input,
      image
    }

    let play = new AllPlays(ctx, root).init()
    play.add_after_init()
    root._update_world()

    loop((dt, dt0) => {
      mouse.update(dt, dt0)
      input.update(dt, dt0)
      play.update(dt, dt0)

      root._update_world()
      _render()
    })
  })

}
