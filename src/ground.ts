import { Soli2d, loop } from 'soli2d'
import Input from './input'
import Mouse from './mouse'
import AllPlays from './play'
import { defaults, configure, Config } from './config'

export default function ground(image: HTMLImageElement, element: HTMLElement, config?: Config) {
    let [_render, root, $canvas] = Soli2d(element, image, 320, 180)

    let input = new Input()
    let mouse = new Mouse($canvas).init()

    let ctx = {
      mouse,
      input,
      image
    }

    let maybeState = defaults()
    let state = configure(maybeState, config || {})

    let play = new AllPlays(ctx, root)
    ._set_data(state)
    .init()
    .add_after_init()
    root._update_world()

    let loop_dispose = loop((dt, dt0) => {
      mouse.update(dt, dt0)
      input.update(dt, dt0)
      play.update(dt, dt0)

      root._update_world()
      _render()
    })

    let dispose = () => {
      loop_dispose()
      mouse.dispose()
    }
    return [play, dispose]
}
