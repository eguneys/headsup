import { Soli2d, loop } from 'soli2d'
import Input from './input'
import Mouse from './mouse'
import AllPlays from './play'

export default function ground(image: HTMLImageElement, element: HTMLElement) {
    let [_render, root, $canvas] = Soli2d(element, image, 1920, 1080)

    let input = new Input()
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

    return play
}
