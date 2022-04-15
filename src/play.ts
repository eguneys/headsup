import { ticks } from './shared'
import { Quad, Transform, Vec2 } from 'soli2d'
import { PlayWithTransform, WithPlays, ColorFactory } from './base'
import { dark, red } from './shared'
import { MouseDrag } from './mouse'
import { Config } from './play-config'

import { T_QN, T_QUAD, scene_import } from './scene-import'

const Template = new Transform()

function vec_transform_inverse(vec: Vec2, transform: Transform) {
  return vec.sub(transform.translate).div(transform.scale)
}

function vec_transform(vec: Vec2, transform: Transform) {
  return vec.add(transform.translate).mul(transform.scale)
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

export type Handler = () => void;

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

  set_select_area_rects(slices: Array<Slice>) {
    this.select_area_rects.forEach(_ => _.remove())

    slices.forEach(slice => this.add_select_area_rect(slice.x, slice.y, slice.w, slice.h))
  }

  get for_save_select_area_rects() {
    return this.select_area_rects.map(_ => ({
      x: _.x,
      y: _.y,
      w: _.width,
      h: _.height
    }))
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

      let click_on_pan = vec_transform_inverse(Vec2.make(...click), this.pan_zoom_scale)

      let [select_area_rect] = this.select_area_rects

      if (select_area_rect) {

        let ref_on_pan = select_area_rect.ref_on_pan.clone
        ref_on_pan.translate = select_area_rect.container.translate.clone


        let width = ref_on_pan.size.x
        let nb = Math.ceil((click_on_pan.x - ref_on_pan.x) / width)

        if (nb > 0) {

          this.select_area_rects.forEach(_ => _.remove())
          this.select_area_rects = []

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

class TransformPlusHandle extends WithPlays {


  a_red = this.colors.quad(red, 2)


  get plus() { return this.data as TransformPlus }
  get handle() { return this.plus.data }

  tile!: Transform

  _init() {
    this.container = Template.clone

    let { a_red } = this

    this.tile = Template.clone
    this.tile.quad = a_red
    this.tile.size = Vec2.make(4, 2)
    this.tile._set_parent(this.container)
    this.tile.translate = vec_transform(Vec2.make(0, 0), this.handle)
  }

  _update(dt: number, dt0: number) {
 
    let { drag } = this.mouse

    if (drag && drag.button === 0) {
      // TODO better way to transform vectors
      this.tile.translate.x, vec_transform_inverse(Vec2.make(...drag.start), this.container._parent._parent).x)
    }


  }
}

class Grouper extends WithPlays {

  bg: GridBackground

  select_transform?: SelectTransform

  _scene!: TransformPlus

  _handles!: TransformPlusHandles
  
  pan_zoom_scale!: Transform
  pan_zoom_scale_handles!: Transform
  pan_zoom_scale_children!: Transform

  _init() {
    this.container = Template.clone

    this.pan_zoom_scale = Template.clone
    this.pan_zoom_scale.scale.set_in(1920/320, 1080/180)
    this.pan_zoom_scale._set_parent(this.container)

    this.bg = new GridBackground(this.ctx, this.pan_zoom_scale, this.plays)
    ._set_data(Vec2.make(320, 180))
    .init()

    this.bg.add_after_init()

    this.pan_zoom_scale_children = Template.clone
    this.pan_zoom_scale_children._set_parent(this.pan_zoom_scale)

    this.pan_zoom_scale_handles = Template.clone
    this.pan_zoom_scale_handles._set_parent(this.pan_zoom_scale)




    let example_scene = [{
      q: [[0, 96, 30, 40], [0, 80, 6, 6, 100, 100]],
      c: []
    }]

    this._scene = scene_import(this.image, example_scene)

    this._handles = this._scene.children.flatMap(_ => {
      if (_.type === T_QN) {
        return _.children.flatMap(_ => {
          if (_.type === T_QUAD) {
            return _.children.map(_ => {
              let res = new TransformPlusHandle(this.ctx, this.pan_zoom_scale_handles, this.plays)
              ._set_data(_)
              .init()

              res.add_after_init()
              return res
            })
          }
          return []
        })
      }
      return []
    })

    this._scene.data._set_parent(this.pan_zoom_scale_children)
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


    if (wheel !== 0) {
      this.pan_zoom_scale.scale.x -= this.pan_zoom_scale.scale.x * 0.3 * wheel
      this.pan_zoom_scale.scale.y -= this.pan_zoom_scale.scale.y * 0.3 * wheel
    }


    this._handles.forEach(_ => _.update(dt, dt0))

  }


}


export default class AllPlays extends PlayWithTransform {

  colors = new ColorFactory(this.image)

  slicer!: Slicer

  get config(): Config {
    return this.data as Config
  }

  get slices() {
    return this.slicer.for_save_select_area_rects
  }

  set slices(slices: Array<SliceFrame>) {
    this.slicer.set_select_area_rects(slices)
  }

  _init() {
    this.container = Template.clone

    this.slicer = new Slicer(this.ctx, this.container, this).init()

    this.grouper = new Grouper(this.ctx, this.container, this).init()

    if (this.config.grouper) {
      this.grouper.add_after_init()
    } else {
      this.slicer.add_after_init()
    }
  }

  _update(dt: number, dt0: number) {
    this.slicer.update(dt, dt0)
    this.grouper.update(dt, dt0)
  }
}
