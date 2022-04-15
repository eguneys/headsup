import { ticks } from './shared'
import { Quad, Transform, Vec2 } from 'soli2d'
import { PlayWithTransform, WithPlays, ColorFactory } from './base'
import { dark } from './shared'
import { MouseDrag } from './mouse'

const Template = new Transform()

function vec_transform(vec: Vec2, transform: Transform) {
  return vec.sub(transform.translate).div(transform.scale)
}

class SelectAreaRectangle extends WithPlays {

  a_light = this.colors.quad(dark, 3)

  get size() { return this.data as Vec2 }
  get width() { return this.size.x }
  get height() { return this.size.y }


  lefts: Array<Transform>
  rights: Array<Transform>
  ups: Array<Transform>
  downs: Array<Transform>

  ref_on_pan!: Transform

  _init() {

    this.rights = []
    this.lefts = []
    this.ups = []
    this.downs = []

    let { rights, lefts, ups, downs } = this

    this.container = Template.clone

    let { a_light, width, height } = this


    this.ref_on_pan = Template.clone
    this.ref_on_pan.quad = a_light
    this.ref_on_pan.size = Vec2.make(width, height)
    //this.ref_on_pan._set_parent(this.container)


    let horiz_tile = Vec2.make(1, 1).half
    for (let j = 0; j < height; j++) {
      let tile = Template.clone
      tile.quad = a_light
      tile.size = horiz_tile
      tile.x = 0
      tile.y = j
      tile._set_parent(this.container)
      
      let tile2 = Template.clone
      tile2.quad = a_light
      tile2.size = horiz_tile
      tile2.x = width - horiz_tile.x
      tile2.y = j
      tile2._set_parent(this.container)

      if (j > 0) {
        ups.push(tile)
        downs.push(tile2)
      }


    }

    let vert_tile = Vec2.make(1, 1).half
    for (let j = 0; j < width; j++) {
      let tile = Template.clone
      tile.quad = a_light
      tile.size = vert_tile
      tile.x = j
      tile.y = 0
      tile._set_parent(this.container)

      let tile2 = Template.clone
      tile2.quad = a_light
      tile2.size = vert_tile
      tile2.x = j
      tile2.y = height - vert_tile.y
      tile2._set_parent(this.container)

      if (j > 0) {
        lefts.push(tile2)
        rights.push(tile)
      }
    }
  }

  _update(dt: number, dt0: number) {
    this.rights.forEach(right => {
      right.x += 8 * dt/ticks.seconds;
      right.x %= this.width - 1
    })
    this.lefts.forEach(right => {
      right.x -= 8 * dt/ticks.seconds;
      right.x += this.width - 1
      right.x %= this.width - 1
    })

    this.downs.forEach(right => {
      right.y += 8 * dt/ticks.seconds;
      right.y %= this.height - 1
    })
    this.ups.forEach(right => {
      right.y -= 8 * dt/ticks.seconds;
      right.y += this.height - 1
      right.y %= this.height - 1
    })


  }
}

class GridBackground extends WithPlays {

  a_dark = this.colors.quad(dark, 1)
  a_light = this.colors.quad(dark, 0)

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

  start_zoomed(orig: Transform) {
    return this.start.sub(orig.translate).div(orig.scale)
  }

  translate_zoomed(orig: Transform) {
    return this.translate.sub(orig.translate).div(orig.scale)
  }
}

class Slicer extends WithPlays {

  bg: GridBackground
  a_image = this.anim(0, 0, 512, 512)

  pan_zoom_scale!: Transform

  pan_drag?: DragDecay
  select_drag?: DragDecay

  select_area_rects: Array<SelectAreaRectangle>

  _init() {
    this.container = Template.clone

    let { a_image } = this

    this.pan_zoom_scale = Template.clone
    this.pan_zoom_scale.scale.set_in(1080/512)
    this.pan_zoom_scale._set_parent(this.container)

    this.pan_zoom_scale.scale.mul_in(Vec2.make(5, 5))

    this.bg = new GridBackground(this.ctx, this.pan_zoom_scale, this.plays)
    ._set_data(Vec2.make(512, 512))
    .init()

    this.bg.add_after_init()

    
    let image = a_image.template
    image._set_parent(this.pan_zoom_scale)


    this.select_area_rects = []
  }

  add_select_area_rect(x: number, y: number, w: number, h: number) {
    let res = new SelectAreaRectangle(this.ctx, this.pan_zoom_scale, this.plays)
    ._set_data(Vec2.make(w, h))
    .init()

    res.x = x
    res.y = y
    res.add_after_init()

    this.select_area_rects.push(res)
  }

  _update(dt: number, dt0: number) {
    let { wheel, drag, click } = this.mouse

    if (drag && drag.button === 1) {
      if (!this.pan_drag) {
        this.pan_drag = DragDecay.make(drag, 
                                       this.pan_zoom_scale.translate)
      }
    }

    if (drag && drag.button === 0) {
      if (!this.select_drag) {
        this.select_drag = DragDecay.make(drag,
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

    if (this.select_drag) {
      this.select_area_rects.forEach(_ => _.remove())
      this.select_area_rects = []


      let start_zoomed = this.select_drag.start_zoomed(this.pan_zoom_scale)
      let translate_zoomed = this.select_drag.translate_zoomed(this.pan_zoom_scale)
      this.add_select_area_rect(Math.floor(start_zoomed.x),
                                Math.floor(start_zoomed.y),
                                Math.ceil(translate_zoomed.x),
                                Math.ceil(translate_zoomed.y))


      if (this.select_drag.drop) {
        this.select_drag = undefined
      }
    }

    if (click) {

      let click_on_pan = vec_transform(Vec2.make(...click), this.pan_zoom_scale)

      let [select_area_rect] = this.select_area_rects

      if (select_area_rect) {

        let ref_on_pan = select_area_rect.ref_on_pan.clone
        ref_on_pan.translate = select_area_rect.container.translate.clone


        let width = ref_on_pan.size.x
        let nb = Math.ceil((click_on_pan.x - ref_on_pan.x) / width)

        if (nb > 0) {

          this.select_area_rects.forEach(_ => _.remove())

          Array.from(Array(nb).keys()).map(i =>
               this.add_select_area_rect(
                 select_area_rect.x + i * width,
                 select_area_rect.y,
                 width,
                 ref_on_pan.size.y
               ))

          
        }
      }


    }

    if (wheel !== 0) {
      this.pan_zoom_scale.scale.x -= this.pan_zoom_scale.scale.x * 0.3 * wheel
      this.pan_zoom_scale.scale.y -= this.pan_zoom_scale.scale.y * 0.3 * wheel
    }

    this.select_area_rects.forEach(_ => _.update(dt, dt0))
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
