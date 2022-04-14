import { Quad, Transform, Vec2 } from 'soli2d'
import { PlayWithTransform, WithPlays, ColorFactory } from './base'
import { dark } from './shared'
import { MouseDrag } from './mouse'

const Template = new Transform()

class GridBackground extends WithPlays {

  a_dark = this.colors.quad(dark, 2)
  a_light = this.colors.quad(dark, 1)

  get size() { return this.data as Vec2 }
  get width() { return this.size.x }
  get height() { return this.size.y }

  _init() {

    this.container = Template.clone
    
    let { a_dark, a_light, width, height } = this

    let tile_size = Vec2.make(8, 8)
    
    for (let j = 0; j < height/8; j++) {
      for (let i = 0; i < width/8; i++) {
        let tile = Template.clone
        tile.quad = (i + j) % 2 === 0 ? a_dark : a_light
        tile.size = tile_size
        tile.x = i * 8
        tile.y = j * 8
        tile._set_parent(this.container)
      }
    }
  }

  _update(dt: number, dt0: number) {}


}

class DragDecay {

  static make = (drag: MouseDrag, orig: Vec2) => { return new DragDecay(drag, orig) }

  decay: Vec2
  start: Vec2

  get translate() {
    return this.move.add(this.decay)
  }

  get move() {
    return Vec2.make(...this.drag.move)
  }

  get drop() {
    return this.drag.drop
  }

  constructor(readonly drag: MouseDrag, readonly orig: Vec2) {
    this.start = Vec2.make(...drag.start)
    this.decay = orig.sub(this.start)
  }

}

class Slicer extends WithPlays {

  bg: GridBackground
  a_image = this.anim(0, 0, 512, 512)

  pan_zoom_scale!: Transform

  pan_drag?: DragDecay

  _init() {
    this.container = Template.clone

    let { a_image } = this

    this.pan_zoom_scale = Template.clone
    this.pan_zoom_scale.scale.set_in(1080/512)
    this.pan_zoom_scale._set_parent(this.container)

    this.bg = new GridBackground(this.ctx, this.pan_zoom_scale, this.plays)
    ._set_data(Vec2.make(512, 512))
    .init()

    this.bg.add_after_init()



    let image = a_image.template
    image._set_parent(this.pan_zoom_scale)

  }

  _update(dt: number, dt0: number) {
    let { wheel, drag, click } = this.mouse

    if (drag && drag.button === 1) {
      if (!this.pan_drag) {
        this.pan_drag = DragDecay.make(drag, 
                                       this.pan_zoom_scale.translate)
      }
    }

    if (this.pan_drag) {

      this.pan_zoom_scale.x = this.pan_drag.translate.x
      this.pan_zoom_scale.y = this.pan_drag.translate.y

      if (this.pan_drag.drop) {
        this.pan_drag = undefined
      }
    }

    this.pan_zoom_scale.scale.x -= this.pan_zoom_scale.scale.x * 0.3 * wheel
    this.pan_zoom_scale.scale.y -= this.pan_zoom_scale.scale.y * 0.3 * wheel
  }

}


export default class AllPlays extends PlayWithTransform {

  colors = new ColorFactory(this.image)

  slicer!: Slicer

  _init() {
    this.container = Template.clone

    this.slicer = new Slicer(this.ctx, this.container, this).init()

    this.slicer.add_after_init()
  }

  _update(dt: number, dt0: number) {
    this.slicer.update(dt, dt0)
  }
}
