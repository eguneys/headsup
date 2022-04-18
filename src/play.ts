import { ticks } from './shared'
import { Rectangle, Quad, Transform, Vec2 } from 'soli2d'
import { HasPlaysParent, PlayWithTransform, WithPlays, ColorFactory } from './base'
import { dark, red } from './shared'
import { MouseDrag } from './mouse'
import { Config } from './play-config'


const Template = new Transform()

function vec_transform_matrix(vec: Vec2, transform: Transform) {
  return transform.world.mVec2(vec)
}

function vec_transform_inverse_matrix(vec: Vec2, transform: Transform) {
  return transform.world.inverse.mVec2(vec)
}

function vec_hit(vec: Vec2, transform: Transform) {

  let { x1, y1, x2, y2 } = Rectangle.unit.transform(transform.world)

  let { x, y } = vec

  return (x1 < x && x < x2 && y1 < y && y < y2)
}


class DragDecay2 {
  static make = (drag: MouseDrag, orig: Transform) => {
    return new DragDecay2(drag, orig)
  }


  get translate() {
    return this.move.add(this.decay)
  }

  get move() {
    return vec_transform_inverse_matrix(Vec2.make(...this.drag.move), this.parent)
  }

  get parent() {
    return this.orig._parent
  }

  get drop() {
    return this.drag.drop
  }


  decay: Vec2
  start: Vec2


  constructor(readonly drag: MouseDrag,
              readonly orig: Transform) {
                this.start = Vec2.make(...drag.start)
                this.decay = orig.translate.sub(vec_transform_inverse_matrix(this.start, orig._parent))
              }

}

export type Handler = () => void;


class HeadsUp extends WithPlays {


  _init() {

    this.container = Template.clone



  }

  _update(dt: number, dt0: number) {
  }

}


export default class AllPlays extends PlayWithTransform {

  colors = new ColorFactory(this.image)

  get config(): Config {
    return this.data as Config
  }

  headsup!: HeadsUp

  _init() {
    this.container = Template.clone

    this.headsup = new HeadsUp(this)
    ._set_data({})
    .init()


    this.headsup.add_after_init()
  }

  _update(dt: number, dt0: number) {
  }
}
